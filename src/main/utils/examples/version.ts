const getElectronVersion: () => string = () => {
  return process.versions.electron
}

export { getElectronVersion }
