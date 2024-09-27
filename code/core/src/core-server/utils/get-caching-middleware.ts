import type Polka from 'polka';

export function getCachingMiddleware(): Polka.Middleware {
  return (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  };
}
