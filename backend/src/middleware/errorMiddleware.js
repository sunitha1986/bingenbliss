export function errorMiddleware(error, _request, response, _next) {
  console.error(error);
  response.status(500).json({ message: "Something went wrong on the server" });
}
