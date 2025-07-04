import { asyncHandler } from "../utils/asyncHandler.js";
import { ResponseApi } from "../utils/ResponseApi.js";

const healthcheck = asyncHandler(async (req, res) => {
  res.status(200).json(new ResponseApi(200, "OK", `health check successful ${req.url}}`));
});

export { healthcheck };
