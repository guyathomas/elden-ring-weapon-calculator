export function commandArguments() {
  const [_binary, currentFile, gameVersion, outputFile] = process.argv;
  return { currentFile, gameVersion, outputFile };
}
