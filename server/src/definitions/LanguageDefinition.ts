// Interfaces

export interface IParameter {
	name: string;
	type: "string" | "value" | "enum" | "label";
	values?: string[];
}

export interface IInstruction {
	name: string;
	description: string;
	group: string;
	parameters: IParameter[];
}

export interface IPseudoOp {
	name: string;
	otherNames: string[];
	canHaveLabel: boolean;
	description: string;
	documentation: string[];
	parameters: IParameter[];
	relatedTo: string[];
}

export interface ILanguageDefinition {
	Instructions: IInstruction[];
	PseudoOps: IPseudoOp[];
	Extensions: {[key: string]:string[]};
	Registers: IRegister[];
}

export interface IRegister {
	name: string;
	address: string;
	description: string;
	documentation: string[];
	bits: number;
}

// Collections

export const Extensions = {
	source: [
		".dasm",
		".asm",
		".a",
	],
	include: [
		".h",
	],
};

export const Instructions:IInstruction[] = [
	{
		name: "ADC",
		description: "ADd to accumulator with Carry",
		group: "Arithmetic",
		parameters: [],
	},
	{
		name: "AND",
		description: "AND memory with accumulator",
		group: "Logical",
		parameters: [],
	},
	{
		name: "ASL",
		description: "Accumulator Shift Left",
		group: "Shift and Rotate",
		parameters: [],
	},
	{
		name: "BCC",
		description: "Branch on Carry Clear (C = 0)",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "BCS",
		description: "Branch on Carry Set (C = 1)",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "BEQ",
		description: "Branch on EQual to zero (Z = 1)",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "BIT",
		description: "test BITs",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "BMI",
		description: "Branch on MInus (N = 1)",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "BNE",
		description: "Branch on Not Equal to zero (Z = 0)",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "BPL",
		description: "Branch on PLus (N = 0)",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "BRK",
		description: "BReaK",
		group: "Other",
		parameters: [],
	},
	{
		name: "BVC",
		description: "Branch on oVerflow Clear (V = 0)",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "BVS",
		description: "Branch on oVerflow Set (V = 1)",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "CLC",
		description: "CLear Carry flag",
		group: "Set and Reset (Clear)",
		parameters: [],
	},
	{
		name: "CLD",
		description: "CLear Decimal mode",
		group: "Set and Reset (Clear)",
		parameters: [],
	},
	{
		name: "CLI",
		description: "CLear Interrupt disable",
		group: "Set and Reset (Clear)",
		parameters: [],
	},
	{
		name: "CLV",
		description: "CLear oVerflow flag",
		group: "Set and Reset (Clear)",
		parameters: [],
	},
	{
		name: "CMP",
		description: "CoMPare memory and accumulator",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "CPX",
		description: "ComPare memory and X",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "CPY",
		description: "ComPare memory and Y",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "DEC",
		description: "DECrement memory by one",
		group: "Increment and Decrement",
		parameters: [],
	},
	{
		name: "DEX",
		description: "DEcrement X by one",
		group: "Increment and Decrement",
		parameters: [],
	},
	{
		name: "DEY",
		description: "DEcrement Y by one",
		group: "Increment and Decrement",
		parameters: [],
	},
	{
		name: "EOR",
		description: "Exclusive-OR memory with Accumulator",
		group: "Logical",
		parameters: [],
	},
	{
		name: "INC",
		description: "INCrement memory by one",
		group: "Increment and Decrement",
		parameters: [],
	},
	{
		name: "INX",
		description: "INcrement X by one",
		group: "Increment and Decrement",
		parameters: [],
	},
	{
		name: "INY",
		description: "INcrement Y by one",
		group: "Increment and Decrement",
		parameters: [],
	},
	{
		name: "JMP",
		description: "JuMP to another location (GOTO)",
		group: "Jump, Branch, Compare, and Test",
		parameters: [],
	},
	{
		name: "JSR",
		description: "Jump to SubRoutine",
		group: "Subroutine",
		parameters: [],
	},
	{
		name: "LDA",
		description: "LoaD the Accumulator",
		group: "Load and Store",
		parameters: [],
	},
	{
		name: "LDX",
		description: "LoaD the X register",
		group: "Load and Store",
		parameters: [],
	},
	{
		name: "LDY",
		description: "LoaD the Y register",
		group: "Load and Store",
		parameters: [],
	},
	{
		name: "LSR",
		description: "Logical Shift Right",
		group: "Shift and Rotate",
		parameters: [],
	},
	{
		name: "NOP",
		description: "No OPeration",
		group: "Other",
		parameters: [],
	},
	{
		name: "ORA",
		description: "OR memory with Accumulator",
		group: "Logical",
		parameters: [],
	},
	{
		name: "PHA",
		description: "PusH Accumulator on stack",
		group: "Transfer",
		parameters: [],
	},
	{
		name: "PHP",
		description: "PusH Processor status on stack",
		group: "Transfer",
		parameters: [],
	},
	{
		name: "PLA",
		description: "PulL Accumulator from stack",
		group: "Transfer",
		parameters: [],
	},
	{
		name: "PLP",
		description: "PulL Processor status from stack",
		group: "Transfer",
		parameters: [],
	},
	{
		name: "ROL",
		description: "ROtate Left",
		group: "Shift and Rotate",
		parameters: [],
	},
	{
		name: "ROR",
		description: "ROtate Right",
		group: "Shift and Rotate",
		parameters: [],
	},
	{
		name: "RTI",
		description: "ReTurn from Interrupt",
		group: "Subroutine",
		parameters: [],
	},
	{
		name: "RTS",
		description: "ReTurn from Subroutine",
		group: "Subroutine",
		parameters: [],
	},
	{
		name: "SBC",
		description: "SuBtract from accumulator with Carry",
		group: "Arithmetic",
		parameters: [],
	},
	{
		name: "SEC",
		description: "SEt Carry",
		group: "Set and Reset (Clear)",
		parameters: [],
	},
	{
		name: "SED",
		description: "SEt Decimal mode",
		group: "Set and Reset (Clear)",
		parameters: [],
	},
	{
		name: "SEI",
		description: "SEt Interrupt disable",
		group: "Set and Reset (Clear)",
		parameters: [],
	},
	{
		name: "STA",
		description: "STore the Accumulator",
		group: "Load and Store",
		parameters: [],
	},
	{
		name: "STX",
		description: "STore the X register",
		group: "Load and Store",
		parameters: [],
	},
	{
		name: "STY",
		description: "STore the Y register",
		group: "Load and Store",
		parameters: [],
	},
	{
		name: "TAX",
		description: "Transfer Accumulator to X",
		group: "Transfer",
		parameters: [],
	},
	{
		name: "TAY",
		description: "Transfer Accumulator to Y",
		group: "Transfer",
		parameters: [],
	},
	{
		name: "TSX",
		description: "Transfer Stack pointer to X",
		group: "Stack",
		parameters: [],
	},
	{
		name: "TXA",
		description: "Transfer X to accumulator",
		group: "Transfer",
		parameters: [],
	},
	{
		name: "TXS",
		description: "Transfer X to Stack pointer",
		group: "Stack",
		parameters: [],
	},
	{
		name: "TYA",
		description: "Transfer Y to Accumulator",
		group: "Transfer",
		parameters: [],
	},
];

export const PseudoOps:IPseudoOp[] = [
	{
		name: "PROCESSOR",
		otherNames: [],
		canHaveLabel: false,
		description: "Sets the processor model",
		documentation: [
			"Determines byte order and integer formats for the assembled data.",
			"Can only be executed once, and should be the first thing encountered by the assembler.",
		],
		parameters: [
			{
				name: "type",
				type: "enum",
				values: [ "6502", "6803", "HD6303", "68705", "68HC11", "F8" ],
			},
		],
		relatedTo: [],
	}, {
		name: "SEG",
		otherNames: [],
		canHaveLabel: true,
		description: "Creates or sets the current segment",
		documentation: [
			"Sets the current segment, creating it if neccessary.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "SEG.U",
		otherNames: [],
		canHaveLabel: true,
		description: "Creates or sets the current segment",
		documentation: [
			"Sets the current segment, creating it (in uninitialized form) if neccessary.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "INCLUDE",
		otherNames: [],
		canHaveLabel: false,
		description: "Includes a file",
		documentation: [
			"Include another assembly file at this location.",
		],
		parameters: [
			{
				name: "filename",
				type: "string",
			},
		],
		relatedTo: [],
	}, {
		name: "INCBIN",
		otherNames: [],
		canHaveLabel: true,
		description: "Includes a file literally",
		documentation: [
			"Include another file literally in the output.",
		],
		parameters: [
			{
				name: "filename",
				type: "string",
			},
		],
		relatedTo: [],
	}, {
		name: "INCDIR",
		otherNames: [],
		canHaveLabel: true,
		description: "Add a dir to the list of include folders",
		documentation: [
			"Add the given directory name to the list of places where INCLUDE and INCBIN search their files.",
			"First, the names are tried relative to the current directory, if that fails and the name is not an absolute pathname, the list is tried.",
		],
		parameters: [
			{
				name: "directory",
				type: "string",
			},
		],
		relatedTo: [],
	}, {
		name: "DC",
		otherNames: ["DC.B", "BYTE"],
		canHaveLabel: true,
		description: "Declare data (byte)",
		documentation: [
			"Declare data in the current segment. No output is generated if within a .U segment.",
			"Note that the byte ordering for the selected processor is used for each entry.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "DC.W",
		otherNames: ["WORD"],
		canHaveLabel: true,
		description: "Declare data (word)",
		documentation: [
			"Declare data in the current segment. No output is generated if within a .U segment.",
			"Note that the byte ordering for the selected processor is used for each entry.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "DC.L",
		otherNames: ["LONG"],
		canHaveLabel: true,
		description: "Declare data (long)",
		documentation: [
			"Declare data in the current segment. No output is generated if within a .U segment.",
			"Note that the byte ordering for the selected processor is used for each entry.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "DS",
		otherNames: ["DS.B"],
		canHaveLabel: true,
		description: "Declare space (byte)",
		documentation: [
			"Declare space. Data is not generated if within an uninitialized segment.",
			"Note that the number of bytes generated is exp * entrysize (1, 2, or 4)",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "DS.W",
		otherNames: [],
		canHaveLabel: true,
		description: "Declare space (word)",
		documentation: [
			"Declare space. Data is not generated if within an uninitialized segment.",
			"Note that the number of bytes generated is exp * entrysize (1, 2, or 4)",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "DS.L",
		otherNames: [],
		canHaveLabel: true,
		description: "Declare space (long)",
		documentation: [
			"Declare space. Data is not generated if within an uninitialized segment.",
			"Note that the number of bytes generated is exp * entrysize (1, 2, or 4)",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "DV",
		otherNames: ["DV.B"],
		canHaveLabel: true,
		description: "Declare data (byte) with assignment",
		documentation: [
			"Declare data in the current segment.",
			"This is equivalent to DC, but each exp in the list is passed through the symbolic expression specified by the EQM label.",
			"The expression is held in a special symbol dotdot '..' on each call to the EQM label.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "DV.W",
		otherNames: [],
		canHaveLabel: true,
		description: "Declare data (word) with assignment",
		documentation: [
			"Declare data in the current segment.",
			"This is equivalent to DC, but each exp in the list is passed through the symbolic expression specified by the EQM label.",
			"The expression is held in a special symbol dotdot '..' on each call to the EQM label.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "DV.L",
		otherNames: [],
		canHaveLabel: true,
		description: "Declare data (long) with assignment",
		documentation: [
			"Declare data in the current segment.",
			"This is equivalent to DC, but each exp in the list is passed through the symbolic expression specified by the EQM label.",
			"The expression is held in a special symbol dotdot '..' on each call to the EQM label.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "HEX",
		otherNames: [],
		canHaveLabel: true,
		description: "Sets down raw HEX data",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "ERR",
		otherNames: [],
		canHaveLabel: false,
		description: "Abort assembly",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "ORG",
		otherNames: [],
		canHaveLabel: true,
		description: "Sets the current origin",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "RORG",
		otherNames: [],
		canHaveLabel: true,
		description: "Activates the relocatable origin",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "ECHO",
		otherNames: [],
		canHaveLabel: false,
		description: "Writes expressions",
		documentation: [
			"The expressions (which may also be strings), are echoed on the screen and into the list file.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "REND",
		otherNames: [],
		canHaveLabel: true,
		description: "Deactivate the relocatable origin for the current segment",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "ALIGN",
		otherNames: [],
		canHaveLabel: true,
		description: "Align the current PC to an N byte boundry",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "SUBROUTINE",
		otherNames: [],
		canHaveLabel: true,
		description: "Creates sets of temporary labels",
		documentation: [
			"This isn't really a subroutine, but a boundary between sets of temporary labels (which begin with a dot).",
		],
		parameters: [],
		relatedTo: [],
	}, {
/*
		name: "symbol EQU",
		otherNames: [],
		canHaveLabel: false,
		description: "The expression is evaluated and the result assigned to the symbol.",
		parameters: [],
		relatedTo: [],
	}, {
		name: "symbol = ",
		otherNames: [],
		canHaveLabel: false,
		description: "The expression is evaluated and the result assigned to the symbol.",
		parameters: [],
		relatedTo: [],
	}, {
		name: "symbol EQM",
		otherNames: [],
		canHaveLabel: false,
		description: "The STRING representing the expression is assigned to the symbol.",
		parameters: [],
		relatedTo: [],
	}, {
		name: "symbol SET",
		otherNames: [],
		canHaveLabel: false,
		description: "Same as EQU, but the symbol may be reassigned later.",
		parameters: [],
		relatedTo: [],
	}, {
*/
		name: "MAC",
		otherNames: [],
		canHaveLabel: false,
		description: "Declares a macro",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "ENDM",
		otherNames: [],
		canHaveLabel: false,
		description: "End of macro definition",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "MEXIT",
		otherNames: [],
		canHaveLabel: false,
		description: "Conditionally exits the current macro level with ",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "IFCONST",
		otherNames: [],
		canHaveLabel: true,
		description: "TRUE when the expression result is defined",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "IFNCONST",
		otherNames: [],
		canHaveLabel: true,
		description: "TRUE when the expression result is undefined",
		documentation: [],
		parameters: [],
		relatedTo: [],
	}, {
		name: "IF",
		otherNames: [],
		canHaveLabel: true,
		description: "Conditional expression",
		documentation: [
			"TRUE if the expression result is defined AND non-zero. Is FALSE if the expression result is defined AND zero.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "ELSE",
		otherNames: [],
		canHaveLabel: true,
		description: "Conditional expression",
		documentation: [
			"ELSE the current IF.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "ENDIF",
		otherNames: ["EIF"],
		canHaveLabel: true,
		description: "Conditional expression",
		documentation: [
			"Terminates an IF. ENDIF and EIF are equivalent.",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "REPEAT",
		otherNames: [],
		canHaveLabel: true,
		description: "Looping",
		documentation: [
			"Repeat code between REPEAT/REPEND 'exp' times",
		],
		parameters: [],
		relatedTo: [],
	}, {
		name: "REPEND",
		otherNames: [],
		canHaveLabel: true,
		description: "Looping",
		documentation: [
			"Repeat code between REPEAT/REPEND 'exp' times",
		],
		parameters: [],
		relatedTo: [],
	}, {
/*
		name: "XXX[.force]",
		otherNames: [],
		canHaveLabel: false,
		description: "XXX is some mnemonic, not necessarily three characters long.",
		parameters: [],
		relatedTo: [],
	}, {
*/
		name: "LIST",
		otherNames: [],
		canHaveLabel: true,
		description: "List control",
		documentation: [
			"Globally turns listing on or off, starting with the current line.",
		],
		parameters: [],
		relatedTo: [],
	},
];

// Reference: http://www.classic-games.com/atari2600/specs.html
export const Registers:IRegister[] = [
	{
		name: "PC",
		address: "",
		description: "Program Counter",
		documentation: [""],
		bits: 16,
	},
	{
		name: "AC",
		address: "",
		description: "Accumulator",
		documentation: [""],
		bits: 8,
	},
	{
		name: "X",
		address: "",
		description: "X Index",
		documentation: [""],
		bits: 8,
	},
	{
		name: "Y",
		address: "",
		description: "Y Index",
		documentation: [""],
		bits: 8,
	},
	{
		name: "SR",
		address: "",
		description: "Processor Status flags in NV-BDIZC format",
		documentation: [""],
		/*
		SR Flags (bit 7 to bit 0):
		N - Negative
		V - Overflow
		- - ignored
		B - Break
		D - Decimal (use BCD for arithmetics)
		I - Interrupt (IRQ disable)
		Z - Zero
		C - Carry
		*/
		bits: 8,
	},
	{
		name: "SP",
		address: "",
		description: "Stack Pointer",
		documentation: [""],
		bits: 8,
	},
];

// Final export

export const LanguageDefinition:ILanguageDefinition = {
	Instructions,
	PseudoOps,
	Extensions,
	Registers,
};

export default LanguageDefinition;
