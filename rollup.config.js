import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'xrhtml.js', 
  external: ['three'],
  output: [{
    file: 'dist/xrhtml.js', 
    format: 'es'
  }], 
  plugins:[nodeResolve()]

};
