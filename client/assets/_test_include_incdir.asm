; thin red line by Kirk Israel
; http://www.atariage.com/2600/programming/2600_101/03first.html
;
;	(anything after a ; is treated as a comment and
;	ignored by DASM)
;
;	 First we have to tell DASM that we're
;	 coding to the 6502:
;

	processor 6502

;
;	then we have to include the "vcs.h" file
;	that includes all the "convenience names"
;	for all the special atari memory locations...
;
	incdir "include_wrong"
	incdir "include/other"
	incdir "includes"
	include "includes_vcs.h"

;
;	now tell DASM where in the memory to place
;	all the code that follows...$F000 is the preferred
; 	spot where it goes to make an atari program
;	(so "org" isn't a 6502 or atari specific command...
;	it's an "assembler directive" that's
;	giving directions to the program that's going to
;	turn our code into binary bits)
;

	org $f000

;
;	Notice everything we've done so far is "INDENTED"
;	Anything that's not indented, DASM treats as a "label"
;	Labels make our lives easier...they say "wherever the
;	next bit of code ends up sitting in physical memory,
;	remember that location as 'labelname'.  That way we
;	can give commands lke "JMP labelname" rather than
;	"JMP $F012" or what not.
;	So we'll call the start of our program "Start".
;	Inspired genius, that.  Clever students will have
;	figured out that since we just told DASM "put the
;	next command at $F000", and then "Call the next memory
;	location 'Start':, we've implicitly said that
;	"Start is $F000"
;

Start

;
;	The next bit of code is pretty standard. When the Atari
;	starts up, all its memory is random scrambled. So the first
;	thing we run is "SEI" "CLD" and "TXS".
;	Look these up if you want,
;	for now know that they're just good things to cleanse
;	the palette...

	SEI	 		; Disable Any Interrupts (hey look! we can put comments here)
	CLD			; Clear BCD math bit.
	LDX #$FF	; put X to the top...
	TXS			; ...and use it reset the stack pointer

;
;	Now this is another pretty standard bit of code to start
;	your program with..it makes a noticeable delay when your
;	atari program starts, and if you're a hot shot you could consider
;	zeroing out only the memory locations you care about, but
;	for now we're gonna start at the top of memory, walk our way
;	down, and put zeros in all of that.
;
;	One thing you may notice is that a lot of atari programming
;	involves starting at a number, and counting your way down
;	to zero, rather than starting at zero and counting your
;	way up. That's because when you're using a Register to
;	hold your counter, it's faster/easier to compare that
;	value to zero than to compare it to the target value
;	you want to stop at.
;
;	So X is going to hold the starting memory location
;	(top of memory, $#FF)...in fact, it's already set to
;	$FF from the previous instruction, so we're not going to
;	bother to set it again...you see that kind of shortcut all
;	the time in people's code, and sometimes it can be confusing,
;	but Atari programs have to be *tight*. The "A"ccumulator is
;	going to hold what we put into each memory location (i.e. zero)

	lda #0			;Put Zero into A, X is at $FF
ClearMem
	STA 0,X			;Store the value of A at the location of 0 plus X
	DEX				;decrement X (decrease X by one)
	BNE ClearMem	;if the last command resulted in something
					;that's "N"ot "Equal" to Zero, branch back
					;to "ClearMem"
;
;	Ok...a word of explanation about "STA 0,X"
;	You might assume that that said "store zero into the memory
;	location pointed to by X..." but rather, it's saying
;	"store whatever's in the accumulator at the location pointed
;	to by (X plus zero)"
;
;	So why does the command do that?  Why isn't there just a
;	"STA X" command? (Go ahead and make the change if you want,
;	DASM will give you an unhelpful error message when you go
;	to assemble.) Here's one explanation, and it has to do with
;	some handwaving I've been doing...memory goes from $0000-$FFFF
;	but those first two hex digits represent the "page" you're dealing
;	with.  $0000-$00FF is the "zero page", $0100-$01FF is the first
;	page, etc.  A lot of the 6502 commands take up less memory
;	when you use the special mode that deals with the zero page,
;	where a lot of the action in atari land takes place.
;	...sooooo, STA $#nnnn would tell it to grab the next two bytes
;	for a full 4 byte address, but this mode only grabs the one
;	value from the zero page
;

;
;	Now we can finally get into some more interesting
;	stuff.  First lets make the background black
;	(Technically we don't have to do this, since $00=black,
;	and we've already set all that memory to zero.
;	But one easy experiment might be to try different two
;	digit hex values here, and see some different colors
;
       LDA #$00		;load value into A ("it's a black thing")
       STA COLUBK	;put the value of A into the background color register

;
;	Do the same basic thing for missile zero...
;	(except missiles are the same color as their associated
;	player, so we're setting the player's color instead
;

       LDA #33
       STA COLUP0

;
;	Now we start our main loop
;	like most Atari programs, we'll have distinct
;	times of Vertical Sync, Vertical Blank,
;	Horizontal blank/screen draw, and then Overscan
;
;	So every time we return control to Mainloop.
;	we're doing another television frame of our humble demo
;	And inside mainloop, we'll keep looping through the
;	section labeled Scanloop...once for each scanline
;

MainLoop
;*********************** VERTICAL SYNC HANDLER
;
;	If you read your Stella Programmer's Guide,
;	you'll learn that bit "D1" of VSYNC needs to be
;	set to 1 to turn on the VSYNC, and then later
;	you set the same bit to zero to turn it off.
;	bits are numbered from right to left, starting
;	with zero...that means VSYNC needs to be set with something
;	like 0010 , or any other pattern where "D1" (i.e. second
;	bit from the right) is set to 1.  0010 in binary
;	is two in decimal, so let's just do that:
;
	LDA  #2
	STA  VSYNC	; Sync it up you damn dirty television!
			; and that vsync on needs to be held for three scanlines...
			; count with me here,
	STA  WSYNC	; one... (our program waited for the first scanline to finish...)
	STA  WSYNC 	; two... (btw, it doesn't matter what we put in WSYNC, it could be anything)
	STA  WSYNC	; three...

;	We blew off that time of those three scanlines, though we could have
;	done some logic there...but most programs will definately want the vertical blank time
;	that follows...
;	you might want to do a lot of things in those 37 lines...so many
;	things that you might become like Dirty Harry: "Did I use up 36 scanlines,
;	or 37? Well, to tell you the truth, in all this excitement, I've kinda lost track
;	myself."  So here's what we do...The Atari has some Timers built in.  You set these
;	with a value, and it counts down...then when you're done thinking, you kill time
;	until that timer has clicked to zero, and then you move on.
;
;	So how much time will those 37 scan lines take?
;	Each scanline takes 76 cycles (which are the same thing our clock is geared to)
;	37*76 = 2812 (no matter what Nick Bensema tries to tell us...his "How to Draw
;	A Playfield" is good in a lot of other ways though..to quote the comments from
;	that:
;		 We must also subtract the five cycles it will take to set the
;		 timer, and the three cycles it will take to STA WSYNC to the next
;		 line.  Plus the checking loop is only accurate to six cycles, making
; 		a total of fourteen cycles we have to waste.
;
;	So, we need to burn 2812-14=2798 cycles.  Now, there are a couple of different
;	timers we can use, and Nick says the one we usually use to make it work out right
;	is TIM64T, which ticks down one every 64 cycles.  2798 / 64 = 43.something,
;	but we have to play conservative and round down.
;

	LDA  #43	;load 43 (decimal) in the accumulator
	STA  TIM64T	;and store that in the timer

	LDA #0		;Zero out the VSYNC
	STA  VSYNC 	; 'cause that time is over

;
;	So here we can do a ton of game logic, and we don't have
;	to worry too much about how many instructions we're doin,
;	as long as it's less than 37 scanlines worth (if it's not
;	less, your program is screwed with a capital screw)
;
;*********************** VERTICAL BLANK WAIT-ER
WaitForVblankEnd
	LDA INTIM	;load timer...
	BNE WaitForVblankEnd	;killing time if the timer's not yet zero

	LDY #191 	;Y is going to hold how many lines we have to do
			;...we're going to count scanlines here. theoretically
			; since this example is ass simple, we could just repeat
			; the timer trick, but often its important to know
			; just what scan line we're at.
	STA WSYNC
	STA VBLANK

			;End the VBLANK period with the zero
			;(since we already have a zero in "A"...or else
			;the BNE wouldn't have let us get here! Atari
			;is full of double use crap like that, and you
			;should comment when you do those tricks)
			;We do a WSYNC just before that so we don't turn on
			;the image in the middle of a line...an error that
			;would be visible if the background color wasn't black.

	;HMM0 is the "horizontal movement register" for Missile 0
	;we're gonna put in a -1 in the left 4 bits ("left nibble",
	; use the geeky term for it)...it's important
	;to note that it's the left 4 bits that metters, what's in the
	;right just doesn't matter, hence the number is #$X0, where
	;X is a digit from 0-F.  In two's complement notation, -1
	;is F if we're only dealing with a single byte.
	;
	; Are you having fun yet?
	;

	LDA #$F0	; -1 in the left nibble, who cares in the right
	STA HMM0	; stick that in the missile mover

	STA WSYNC	;wait for one more line, so we know things line up
	STA HMOVE 	;and activate that movement
			;note...for godawful reasons, you must do HMOVE
			;right after a damn WSYNC. I might be wasting a scanline
			;with this, come to think of it

;*********************** Scan line Loop
ScanLoop

	STA WSYNC 	;Wait for the previous line to finish
	LDA #2		;now sticking a 2 in ENAM0 (i.e. bit D1) will enable Missile 0
	STA ENAM0	;we could've done this just once for the whole program
			;since we never turn it off, but i decided to do it again and
			;again, since usually we'd have to put smarter logic in
			; each horizontal blank
			;
			;so at some point in here, after 68 clock cycles to be exact,
			;TIA will start drawing the line...all the missiles and players
			;and what not better be ready...unless we *really* know what
			;we're doing.

	DEY		;subtract one off the line counter thingy
	BNE ScanLoop	;and repeat if we're not finished with all the scanlines.

	LDA #2		;#2 for the VBLANK...
	STA WSYNC  	;Finish this final scanline.
	STA VBLANK 	; Make TIA output invisible for the overscan,
			; (and keep it that way for the vsync and vblank)
;***************************** OVERSCAN CALCULATIONS
;
;I'm just gonna count off the 30 lines of the overscan.
;You could do more program code if you wanted to.


	LDX #30		;store 30
OverScanWait
	 STA WSYNC
	 DEX
	 BNE OverScanWait

	JMP  MainLoop      ;Continue this loop forver! Back to the code for the vsync etc


; OK, last little bit of crap to take care of.
; there are two special memory locations, $FFFC and $FFFE
; When the atari starts up, a "reset" is done (which has nothing to do with
; the reset switch on the console!) When this happens, the 6502 looks at
; memory location $FFFC (and by extension its neighbor $FFFD, since it's
; seaching for both bytes of a full memory address)  and then goes to the
; location pointed to by $FFFC/$FFFD...so our first .word Start tells DASM
; to put the binary data that we labeled "Start" at the location we established
; with org.  And then we do it again for $FFFE/$FFFF, which is for a special
; event called a BRK which you don't have to worry about now.

	org $FFFC
	.word Start
	.word Start
