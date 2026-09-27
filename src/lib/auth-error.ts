export function readableAuthEmailError(message: string): string {
  const normalised = message.toLowerCase();

  if (
    normalised.includes("email rate limit")
    || normalised.includes("email rate exceeded")
    || normalised.includes("too many requests")
    || normalised.includes("rate limit")
  ) {
    return "Too many emails have been requested. Please wait 60 seconds before trying again. If you have already requested several emails today, please try again in an hour.";
  }

  return message;
}
