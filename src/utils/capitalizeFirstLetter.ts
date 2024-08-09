function capitalizeFirstLetter(str: string): string {
    const lowerCaseString = str.toLowerCase();
    return lowerCaseString.charAt(0).toUpperCase() + lowerCaseString.slice(1);
  }

export default capitalizeFirstLetter;