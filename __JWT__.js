/***
 * install jsonwebtoken
 * jwt.sign (payload, secret, {expiresIn:})
 * token client
 */

/***
 * how to store token in the client side
 * 1. memory ---> ok type
 * 2. localStorage ---> ok type (XSS)
 * 3. cookies: http only. for development secure: false
 */

/***
 * 1. set cookies with http only. for development secure: false,
 * 2. cors
 * app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true
  })
);
 *
 * 3. client side axios setting
 * in axios set WithCredentials: true
 */

/***
 * 1, to send cookies from the client make sure you added withCredentials: true for the api call using axios or fetch.
 */
