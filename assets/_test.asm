; Comments
; --------

; Definitions and declarations
VSYNC   =       $00
VBLANK  =       $01
WSYNC   =       $02
NUSIZ0  =       $04
NUSIZ1  =       $05
COLUPF  =       $08
COLUBK  =       $09
PF0     =       $0D
PF1     =       $0E
PF2     =       $0F
SWCHA   =       $280
INTIM   =       $284
TIM64T  =       $296
SomeVar			equ	$17
LoChar			equ #41
HiChar			equ #90
THREE_COPIES    equ %011

counter		byte	; increments each frame

; Initial processor directive
	processor 6502
; File include
	include "vcs.h"

; Instructions with number
		org %1111000000000000	; Binary
		org 0170000				; Octal
		org 61440				; Decimal
		org $F000				; Hexa
		org 'xxx				; Char
		org "xxx"				; String

        seg.u Initialization

; Labels
start	SEI				; Start
start2	STA SOM			; Start, command
		BNE start2		; Go to
		LDX  #$FF		; Instruction with constant
		CLD
		LDX  #$FF
		TXS
		LDA  #$00

; Skip
		.word Start
		.word Start

; Definitions
zero	STA  $00,x
		LDA  #$01
		lda  #185-SpriteHeight
		lda  #TopBorder0-20,x
		lda  #%00010000	;Up?
		STA  CTRLP
        lda  (CTRLP),y
		lda  (CTRLP), y
		LDA  #SomeVar
        isb  YP0
        bcs  .DoDraw
		LDA  #0
		LDA  #$0C
		STA  HOURS
		LDA  #$3C
		STA  MINS
		LDA  #$ca
		STA  COLUP
		MAC GET_APPROX_SCANLINE
        ldy INTIM
		lda  #$07
		sta  NUSIZ
		sta  NUSIZ
		lda  #$3C
		sta  FRAME
		sta  SECS
        beq .Empty0
        lda #<Data0
        sta PFPtr
		sbc #15
		bcs DivideLoop
		eor #7
		lda #<String1
        sta StrPtr
        lda #>String1

main    JSR  vertb
		JSR  time
		JSR  draw
		JSR  clear
		JMP  main

vertb   LDX  #$00       ;vertical blank, We all know what this is about
		LDA  #$02
		LDA  #$2C
		STA  TIM64T
		LDA  #$00
		STA  WSYNC
		STA  VSYNC
		RTS

		cmp  #$28       ;see if it's more than 40 minutes
		bpl  min4

min0    lda  zeros,y    ;minutes must be less than 10 so load 00 sprite
		and  #$F0       ;strip the first 4 bits
		sta  SPRITEA,y  ;store it to sprite A memory
		dey
		bpl  min0       ;get next sprite line
		lda  #$00       ;less than 10 minutes
		jmp  minload    ;go to where we load the first 4 bits of sprite
		SLEEP 20

		REPEAT 30
        .byte
        REPEND
        TIMER_WAIT
		TIMER_SETUP 30
        TIMER_WAIT
		lda FontTableLo+2,y
        ora FontTableHi+2,x

numblk  .word  zeros    ;where all the sprites are at
		.word  ones
		.word  twos
		.word  threes
		.word  fours
		.word  fives
		.word  sixes
		.word  sevens
		.word  eights
		.word  nines

		nop

zeros   .byte %11100111 ;sprites are stored upsidedown, and there
		.byte %10100101 ;are two copies of each number in each sprite
		.byte %10100101 ;location. The unwanted number is stripped
		.byte %10100101 ;with the AND command (AND #$0F for the right
		.byte %10100101 ;number stripped, AND #F0 for the left)
		.byte %10100101 ;then any two numbers can be combined with an
		.byte %11100111 ;OR command. Neat huh?

String0	dc "HELLO[WORLD?"
String1 dc "TEXT[IS[NICE"

Frame0
		.byte #0
        .byte #%01101100;$F6
        .byte #%00101000;$86
        .byte #%00101000;$86
        .byte #%00111000;$86
        .byte #%10111010;$C2
        .byte #%10111010;$C2
        .byte #%01111100;$C2
        .byte #%00111000;$C2
        .byte #%00111000;$16
        .byte #%01000100;$16
        .byte #%01111100;$16
        .byte #%01111100;$18
        .byte #%01010100;$18
        .byte #%01111100;$18
        .byte #%11111110;$F2
        .byte #%00111000;$F4

ColorFrame0
		.byte #$FF;
		.byte #$F6;
		.byte #$86;
		.byte #$86;
		.byte #$86;
		.byte #$C2;
		.byte #$C2;
		.byte #$C2;
		.byte #$C2;
		.byte #$16;
		.byte #$16;
		.byte #$16;
		.byte #$18;
		.byte #$18;
		.byte #$18;
		.byte #$F2;
		.byte #$F4;
