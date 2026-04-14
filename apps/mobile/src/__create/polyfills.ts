// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import updatedFetch from './fetch';
// @ts-expect-error -- updatedFetch wraps the native fetch with custom headers
global.fetch = updatedFetch;
