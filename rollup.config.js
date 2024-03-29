import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'xrhtml.js', 
  external: ['three'],
  output: [{
    file: 'dist/xrhtml.js', 
    format: 'iife',  //'amd', // or 'iife', 'umd', 'cjs'
    name: 'xrhtml' 
  }], 
  plugins:[nodeResolve()]

};
