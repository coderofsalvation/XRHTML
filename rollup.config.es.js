import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'xrhtml.js', 
  external: ['three'],
  output: [{
    file: 'dist/xrhtml.es.js', 
    format: 'es'  //'amd', // or 'iife', 'umd', 'cjs'
  }], 
  plugins:[nodeResolve()]

};
