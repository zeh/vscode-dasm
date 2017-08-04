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
	; VCS.H
; Version 1.05, 13/November/2003

VERSION_VCS         = 105

; THIS IS A PRELIMINARY RELEASE OF *THE* "STANDARD" VCS.H
; THIS FILE IS EXPLICITLY SUPPORTED AS A DASM-PREFERRED COMPANION FILE
; PLEASE DO *NOT* REDISTRIBUTE THIS FILE!
;
; This file defines hardware registers and memory mapping for the
; Atari 2600. It is distributed as a companion machine-specific support package
; for the DASM compiler. Updates to this file, DASM, and associated tools are
; available at at http://www.atari2600.org/dasm
;
; Many thanks to the original author(s) of this file, and to everyone who has
; contributed to understanding the Atari 2600.  If you take issue with the
; contents, or naming of registers, please write to me (atari2600@taswegian.com)
; with your views.  Please contribute, if you think you can improve this
; file!
;
; Latest Revisions...
; 1.05  13/NOV/2003      - Correction to 1.04 - now functions as requested by MR.
;                        - Added VERSION_VCS equate (which will reflect 100x version #)
;                          This will allow conditional code to verify VCS.H being
;                          used for code assembly.
; 1.04  12/NOV/2003     Added TIA_BASE_WRITE_ADDRESS and TIA_BASE_READ_ADDRESS for
;                       convenient disassembly/reassembly compatibility for hardware
;                       mirrored reading/writing differences.  This is more a
;                       readability issue, and binary compatibility with disassembled
;                       and reassembled sources.  Per Manuel Rotschkar's suggestion.
; 1.03  12/MAY/2003     Added SEG segment at end of file to fix old-code compatibility
;                       which was broken by the use of segments in this file, as
;                       reported by Manuel Polik on [stella] 11/MAY/2003
; 1.02  22/MAR/2003     Added TIMINT($285)
; 1.01	        		Constant offset added to allow use for 3F-style bankswitching
;						 - define TIA_BASE_ADDRESS as $40 for Tigervision carts, otherwise
;						   it is safe to leave it undefined, and the base address will
;						   be set to 0.  Thanks to Eckhard Stolberg for the suggestion.
;                          Note, may use -DLABEL=EXPRESSION to define TIA_BASE_ADDRESS
;                        - register definitions are now generated through assignment
;                          in uninitialised segments.  This allows a changeable base
;                          address architecture.
; 1.0	22/MAR/2003		Initial release


;-------------------------------------------------------------------------------

; TIA_BASE_ADDRESS
; The TIA_BASE_ADDRESS defines the base address of access to TIA registers.
; Normally 0, the base address should (externally, before including this file)
; be set to $40 when creating 3F-bankswitched (and other?) cartridges.
; The reason is that this bankswitching scheme treats any access to locations
; < $40 as a bankswitch.

			IFNCONST TIA_BASE_ADDRESS
TIA_BASE_ADDRESS	= 0
			ENDIF

; Note: The address may be defined on the command-line using the -D switch, eg:
; dasm.exe code.asm -DTIA_BASE_ADDRESS=$40 -f3 -v5 -ocode.bin
; *OR* by declaring the label before including this file, eg:
; TIA_BASE_ADDRESS = $40
;   include "vcs.h"

; Alternate read/write address capability - allows for some disassembly compatibility
; usage ; to allow reassembly to binary perfect copies).  This is essentially catering
; for the mirrored ROM hardware registers.

; Usage: As per above, define the TIA_BASE_READ_ADDRESS and/or TIA_BASE_WRITE_ADDRESS
; using the -D command-line switch, as required.  If the addresses are not defined,
; they defaut to the TIA_BASE_ADDRESS.

     IFNCONST TIA_BASE_READ_ADDRESS
TIA_BASE_READ_ADDRESS = TIA_BASE_ADDRESS
     ENDIF

     IFNCONST TIA_BASE_WRITE_ADDRESS
TIA_BASE_WRITE_ADDRESS = TIA_BASE_ADDRESS
     ENDIF

;-------------------------------------------------------------------------------

			SEG.U TIA_REGISTERS_WRITE
			ORG TIA_BASE_WRITE_ADDRESS

	; DO NOT CHANGE THE RELATIVE ORDERING OF REGISTERS!

VSYNC       ds 1    ; $00   0000 00x0   Vertical Sync Set-Clear
VBLANK		ds 1	; $01   xx00 00x0   Vertical Blank Set-Clear
WSYNC		ds 1	; $02   ---- ----   Wait for Horizontal Blank
RSYNC		ds 1	; $03   ---- ----   Reset Horizontal Sync Counter
NUSIZ0		ds 1	; $04   00xx 0xxx   Number-Size player/missle 0
NUSIZ1		ds 1	; $05   00xx 0xxx   Number-Size player/missle 1
COLUP0		ds 1	; $06   xxxx xxx0   Color-Luminance Player 0
COLUP1      ds 1    ; $07   xxxx xxx0   Color-Luminance Player 1
COLUPF      ds 1    ; $08   xxxx xxx0   Color-Luminance Playfield
COLUBK      ds 1    ; $09   xxxx xxx0   Color-Luminance Background
CTRLPF      ds 1    ; $0A   00xx 0xxx   Control Playfield, Ball, Collisions
REFP0       ds 1    ; $0B   0000 x000   Reflection Player 0
REFP1       ds 1    ; $0C   0000 x000   Reflection Player 1
PF0         ds 1    ; $0D   xxxx 0000   Playfield Register Byte 0
PF1         ds 1    ; $0E   xxxx xxxx   Playfield Register Byte 1
PF2         ds 1    ; $0F   xxxx xxxx   Playfield Register Byte 2
RESP0       ds 1    ; $10   ---- ----   Reset Player 0
RESP1       ds 1    ; $11   ---- ----   Reset Player 1
RESM0       ds 1    ; $12   ---- ----   Reset Missle 0
RESM1       ds 1    ; $13   ---- ----   Reset Missle 1
RESBL       ds 1    ; $14   ---- ----   Reset Ball
AUDC0       ds 1    ; $15   0000 xxxx   Audio Control 0
AUDC1       ds 1    ; $16   0000 xxxx   Audio Control 1
AUDF0       ds 1    ; $17   000x xxxx   Audio Frequency 0
AUDF1       ds 1    ; $18   000x xxxx   Audio Frequency 1
AUDV0       ds 1    ; $19   0000 xxxx   Audio Volume 0
AUDV1       ds 1    ; $1A   0000 xxxx   Audio Volume 1
GRP0        ds 1    ; $1B   xxxx xxxx   Graphics Register Player 0
GRP1        ds 1    ; $1C   xxxx xxxx   Graphics Register Player 1
ENAM0       ds 1    ; $1D   0000 00x0   Graphics Enable Missle 0
ENAM1       ds 1    ; $1E   0000 00x0   Graphics Enable Missle 1
ENABL       ds 1    ; $1F   0000 00x0   Graphics Enable Ball
HMP0        ds 1    ; $20   xxxx 0000   Horizontal Motion Player 0
HMP1        ds 1    ; $21   xxxx 0000   Horizontal Motion Player 1
HMM0        ds 1    ; $22   xxxx 0000   Horizontal Motion Missle 0
HMM1        ds 1    ; $23   xxxx 0000   Horizontal Motion Missle 1
HMBL        ds 1    ; $24   xxxx 0000   Horizontal Motion Ball
VDELP0      ds 1    ; $25   0000 000x   Vertical Delay Player 0
VDELP1      ds 1    ; $26   0000 000x   Vertical Delay Player 1
VDELBL      ds 1    ; $27   0000 000x   Vertical Delay Ball
RESMP0      ds 1    ; $28   0000 00x0   Reset Missle 0 to Player 0
RESMP1      ds 1    ; $29   0000 00x0   Reset Missle 1 to Player 1
HMOVE       ds 1    ; $2A   ---- ----   Apply Horizontal Motion
HMCLR       ds 1    ; $2B   ---- ----   Clear Horizontal Move Registers
CXCLR       ds 1    ; $2C   ---- ----   Clear Collision Latches

;-------------------------------------------------------------------------------

			SEG.U TIA_REGISTERS_READ
			ORG TIA_BASE_READ_ADDRESS

                    ;											bit 7   bit 6
CXM0P       ds 1    ; $00       xx00 0000       Read Collision  M0-P1   M0-P0
CXM1P       ds 1    ; $01       xx00 0000                       M1-P0   M1-P1
CXP0FB      ds 1    ; $02       xx00 0000                       P0-PF   P0-BL
CXP1FB      ds 1    ; $03       xx00 0000                       P1-PF   P1-BL
CXM0FB      ds 1    ; $04       xx00 0000                       M0-PF   M0-BL
CXM1FB      ds 1    ; $05       xx00 0000                       M1-PF   M1-BL
CXBLPF      ds 1    ; $06       x000 0000                       BL-PF   -----
CXPPMM      ds 1    ; $07       xx00 0000                       P0-P1   M0-M1
INPT0       ds 1    ; $08       x000 0000       Read Pot Port 0
INPT1       ds 1    ; $09       x000 0000       Read Pot Port 1
INPT2       ds 1    ; $0A       x000 0000       Read Pot Port 2
INPT3       ds 1    ; $0B       x000 0000       Read Pot Port 3
INPT4       ds 1    ; $0C		x000 0000       Read Input (Trigger) 0
INPT5       ds 1	; $0D		x000 0000       Read Input (Trigger) 1

;-------------------------------------------------------------------------------

			SEG.U RIOT
			ORG $280

	; RIOT MEMORY MAP

SWCHA       ds 1    ; $280      Port A data register for joysticks:
					;			Bits 4-7 for player 1.  Bits 0-3 for player 2.

SWACNT      ds 1    ; $281      Port A data direction register (DDR)
SWCHB       ds 1    ; $282		Port B data (console switches)
SWBCNT      ds 1    ; $283      Port B DDR
INTIM       ds 1    ; $284		Timer output

TIMINT  	ds 1	; $285

		; Unused/undefined registers ($285-$294)

			ds 1	; $286
			ds 1	; $287
			ds 1	; $288
			ds 1	; $289
			ds 1	; $28A
			ds 1	; $28B
			ds 1	; $28C
			ds 1	; $28D
			ds 1	; $28E
			ds 1	; $28F
			ds 1	; $290
			ds 1	; $291
			ds 1	; $292
			ds 1	; $293

TIM1T       ds 1    ; $294		set 1 clock interval
TIM8T       ds 1    ; $295      set 8 clock interval
TIM64T      ds 1    ; $296      set 64 clock interval
T1024T      ds 1    ; $297      set 1024 clock interval

;-------------------------------------------------------------------------------
; The following required for back-compatibility with code which does not use
; segments.

            SEG

; EOF


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