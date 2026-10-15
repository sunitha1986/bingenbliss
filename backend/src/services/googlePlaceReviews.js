const defaultPlaceId = "ChIJKYOcHAjjpikR8xKhtVq_pm8";
const cacheDurationMs = 24 * 60 * 60 * 1000;
let cachedResult;
let cacheExpiresAt = 0;
let pendingRequest;

function normalizePlaceData(place) {
  return {
    displayName: place.displayName?.text || "Vasmi Group",
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? 0,
    googleMapsUri: place.googleMapsUri || "",
    reviews: (place.reviews || []).map((review) => ({
      rating: review.rating ?? 0,
      text: review.text?.text || "",
      relativePublishTimeDescription:
        review.relativePublishTimeDescription || "",
      authorAttribution: {
        displayName:
          review.authorAttribution?.displayName || "Google Reviewer",
        photoUri: review.authorAttribution?.photoUri || "",
        uri: review.authorAttribution?.uri || "",
      },
      googleMapsUri: review.googleMapsUri || "",
    })),
  };
}

async function fetchPlaceReviews() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    const error = new Error("Google reviews are not configured.");
    error.statusCode = 503;
    throw error;
  }

  const placeId = process.env.GOOGLE_PLACES_PLACE_ID || defaultPlaceId;
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,displayName,rating,userRatingCount,reviews,googleMapsUri",
      },
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    let providerError;
    try {
      providerError = JSON.parse(responseText).error;
    } catch {
      providerError = undefined;
    }

    console.error("Google Places API request failed", {
      httpStatus: response.status,
      providerStatus: providerError?.status,
      providerMessage: providerError?.message,
    });

    const error = new Error("Google reviews are temporarily unavailable.");
    error.statusCode = 502;
    throw error;
  }

  return normalizePlaceData(await response.json());
}

export async function getGooglePlaceReviews() {
  if (cachedResult && Date.now() < cacheExpiresAt) return cachedResult;
  if (pendingRequest) return pendingRequest;

  pendingRequest = fetchPlaceReviews()
    .then((result) => {
      cachedResult = result;
      cacheExpiresAt = Date.now() + cacheDurationMs;
      return result;
    })
    .finally(() => {
      pendingRequest = undefined;
    });

  return pendingRequest;
}
