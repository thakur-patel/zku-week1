const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { groth16, plonk } = require("snarkjs");

// circom_tester : tools for testing circom circuits
// .wasm : it refers to the wasm subfolder, i.e., circom_tester/wasm [exports.wasm = require("./wasm/tester");]
const wasm_tester = require("circom_tester").wasm;

// ffjavascript: tools to do finite field operations in javascript
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;

// 21888242871839275222246405745257275088548364400416034343698204186575808495617 is the order of the finite field. It is a prime number.
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

describe("HelloWorld", function () {
    // timeout is the maximum time test will wait for done before set test as failed. Here, timeout is set as 100000000 ms.
    this.timeout(100000000);
    let Verifier;
    let verifier;

    // deploying the verifier contract
    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply two numbers correctly", async function () {

        // calls the wasm_tester() function at circom_tester/wasm/tester.js
        // One parameter is provided --> circomInput: "contracts/circuits/HelloWorld.circom"
        // wasm_tester() returns a WasmTester object 
        
        // Three values are passed when creating a WasmTester object: 
        // 1. options.output --> it returns the directory string 
        //                       In code, it returns the _options paramter 
        //                       (_options is passed as the second parameter in wasm_tester() butin the line below, no second parameter is provided when the function is called)
        // 2. baseName --> it returns the file name WITHOUT the extension: Helloworld (Source: https://www.w3schools.com/nodejs/met_path_basename.asp)
        // 3. wc --> 'wc' is a WitnessCalculator object
        //           1. the builder() function at circom_tester/wasm/witness_calculator.js is called
        //           2. builder() takes the wasm file as parameter and returns a WitnessCalculator object

        // circuit is a WasmTester object
        const circuit = await wasm_tester("contracts/circuits/HelloWorld.circom");
        // console.log(circuit);

        const INPUT = {
            "a": 2,
            "b": 3
        }

        // returns a witness array 'w' , i.e, WITNESS GENERATION
        const witness = await circuit.calculateWitness(INPUT, true);

        console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(6)));

    });

    it("Should return true for correct proof", async function () {
        // PROOF GENERATION:
        // Comparing it to the notes I made,
        // {"a":"2","b":"3"} <--> in.json (INPUT FILE)
        // "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm" <--> multiplier-js/multiplier.wasm (WITNESS GENERATION REQUIRES .WASM FILE)
        // "contracts/circuits/HelloWorld/circuit_final.zkey" <--> multiplier.zkey (Sp: PUBLIC PARAMETER FOR PROVER)
        // Step 1) INPUT FILE and .WASM FILE generates the WITNESS
        // Step 2) WITNESS (.WTNS) and PUBLIC PARAMETER FOR PROVER generates "proof.json" and "public.json"
        const { proof, publicSignals } = await groth16.fullProve({"a":"2","b":"3"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        // console.log(publicSignals);
        console.log('2x3 =',publicSignals[0]);
        
        // exports the proof.json and public.json files in bytes format in order to let HelloWorld.sol understand it
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
        // console.log(calldata);
    
        // numbers in the calldata array are converted from HEX(base16) to DEC(base10)
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
        // console.log(argv);
    
        // a, b, c and Input are the paramters that'll be passed to the verifier contract function 
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {

    this.timeout(100000000);
    let Verifier;
    let verifier;
    
    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply three numbers correctly", async function () {
        //[assignment] insert your script here
        const circuit = await wasm_tester("contracts/circuits/Multiplier3.circom");

        const INPUT = {
            "a": 2,
            "b": 3,
            "c": 5
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]), Fr.e(30)));
    });

    it("Should return true for correct proof", async function () {
        const { proof, publicSignals } = await groth16.fullProve({"a":"2","b":"3","c":"5"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");
        
        // 'proof' has the values in DEC(base10)
        console.log(proof); 

        console.log(publicSignals); // publicSignals is an array of a single element
        console.log('2x3x5 =',publicSignals[0]);
        
        // exports the proof.json and public.json files in bytes format in order to let HelloWorld.sol understand it
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals); 
        // 'calldata' has the values in HEX(base16)
        console.log(calldata);
    
        // numbers in the calldata array are converted from HEX(base16) back to DEC(base10)
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
        // now the 'proof' object becomes an array of numbers in base10
        console.log(argv);
    
        // a, b, c and Input are the paramters that'll be passed to the verifier contract function 
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;

    });

    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {

    this.timeout(100000000);
    let Verifier;
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("Multiplier3Verifier_plonk");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await plonk.fullProve({"a":"2","b":"3","c":"5"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_0000.zkey");
        
        console.log(proof);

        console.log('publicSignals: ', publicSignals);
        console.log('2x3x5 =', publicSignals[0]);
        
        // exports the proof.json and public.json files in bytes format in order to let HelloWorld.sol understand it
        const calldata = await plonk.exportSolidityCallData(proof, publicSignals);
        console.log(calldata);
    
        // -- upto this point, library functions were called from plonk. those are sound code. --
        // So, the changes required for this task will be in the code below:- 

        // split() returns an array of the values
        // const argv = calldata.split(',').map(x => BigInt(x).GetBytes());
        const argv = calldata.split(',');
        console.log(argv);
    
        // the 1st parameter has to be of 'bytes' solidity datatype
        // the 2nd parameter has to be an 'uint[]' (a uint array)
        // **IMP: In solidity, string can't be passed in functions, so bytes datatype is used instead
        // So, we go ahead and pass the string we have in argv[0] as the parameter for verifyProof
        expect(await verifier.verifyProof(argv[0], publicSignals)).to.be.true;

    });
    
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let a = [0];
        let d = [0];
        expect(await verifier.verifyProof(a, d)).to.be.false;
    });
});