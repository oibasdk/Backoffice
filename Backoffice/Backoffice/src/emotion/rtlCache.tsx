import createCache from '@emotion/cache';
import stylisRTLPlugin from 'stylis-plugin-rtl';

// Create an Emotion cache that applies RTL if needed.
export const createRtlCache = (shouldRtl = false) => {
  return createCache({
    key: shouldRtl ? 'mui-rtl' : 'mui',
    stylisPlugins: shouldRtl ? [stylisRTLPlugin] : [],
  });
};

export default createRtlCache;
