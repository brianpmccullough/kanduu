// Image files are bundled by SPFx's webpack as separate assets; importing one gives its URL.
declare module '*.png' {
  const url: string;
  export default url;
}
