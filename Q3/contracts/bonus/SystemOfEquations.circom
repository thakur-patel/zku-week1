pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib-matrix/circuits/matMul.circom"; // hint: you can use more than one templates in circomlib-matrix to help you

template SystemOfEquations(n) { // n is the number of variables in the system of equations
    signal input x[n]; // this is the solution to the system of equations
    signal input A[n][n]; // this is the coefficient matrix
    signal input b[n]; // this are the constants in the system of equations
    signal output out; // 1 for correct solution, 0 for incorrect solution

    // [bonus] insert your code here
    signal prod[n];
    signal bool[n];

    component product = matMul(n,n,1);
    component eq[n];

    product.a <== A;

    for (var i=0; i < n; i++){
        product.b[i][0] <== x[i];
    }
    
    var total = 0;

    for (var i=0; i<n; i++){
        eq[i] = IsEqual();
        eq[i].in[0] <== b[i];
        eq[i].in[1] <== product.out[i][0];
        bool[i] <== eq[i].out;
    }

    signal boolProd[n];
    boolProd[0] <== bool[0];

    for (var i=1; i<n; i++){
        boolProd[i] <== boolProd[i-1] * bool[i];
    }
    out <== boolProd[n-1];

}

component main {public [A, b]} = SystemOfEquations(3);