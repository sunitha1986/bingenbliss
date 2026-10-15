import { getGooglePlaceReviews } from "../services/googlePlaceReviews.js";

export async function googlePlaceReviews(_request, response, next) {
  try {
    const place = await getGooglePlaceReviews();
    response.set("Cache-Control", "public, max-age=3600");
    return response.json(place);
  } catch (error) {
    return next(error);
  }
}
