const fs = require("fs");
const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/

const verifierRegex = /contract Verifier/

let content = fs.readFileSync("./contracts/HelloWorldVerifier.sol", { encoding: 'utf-8' });
let bumped = content.replace(solidityRegex, 'pragma solidity ^0.8.0');
bumped = bumped.replace(verifierRegex, 'contract HelloWorldVerifier');

fs.writeFileSync("./contracts/HelloWorldVerifier.sol", bumped);

// [assignment] add your own scripts below to modify the other verifier contracts you will build during the assignment

const solidityRegexMultiplier3 = /pragma solidity \^\d+\.\d+\.\d+/

const verifierRegexMultiplier3 = /contract Verifier/

let contentMultiplier3 = fs.readFileSync("./contracts/Multiplier3Verifier.sol", { encoding: 'utf-8' });
let bumpedMultiplier3 = contentMultiplier3.replace(solidityRegexMultiplier3, 'pragma solidity ^0.8.0');
bumpedMultiplier3 = bumpedMultiplier3.replace(verifierRegexMultiplier3, 'contract Multiplier3Verifier');

fs.writeFileSync("./contracts/Multiplier3Verifier.sol", bumpedMultiplier3);
