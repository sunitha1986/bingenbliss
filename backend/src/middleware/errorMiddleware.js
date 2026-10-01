export function errorMiddleware(error, _request, response, _next) {
  console.error(error);
  response
    .status(error.statusCode || 500)
    .json({
      message: error.statusCode
        ? error.message
        : "Something went wrong on the server",
    });
}
