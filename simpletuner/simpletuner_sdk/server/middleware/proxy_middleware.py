"""
Proxy middleware for handling reverse proxy headers and base URL configuration.
"""

import logging
from typing import Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)


class ProxyMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle reverse proxy headers and set base_url for templates.
    
    This middleware:
    - Detects proxy configuration from X-Forwarded headers
    - Sets request.state.base_url for template rendering
    - Ensures static resources and API calls work correctly with proxy paths
    """
    
    async def dispatch(self, request: Request, call_next):
        # Get proxy headers
        forwarded_proto = request.headers.get("x-forwarded-proto")
        forwarded_host = request.headers.get("x-forwarded-host")
        forwarded_port = request.headers.get("x-forwarded-port")
        forwarded_prefix = request.headers.get("x-forwarded-prefix")
        
        # Build base_url from proxy headers or use request.base_url
        if forwarded_host:
            # Use proxy headers
            scheme = forwarded_proto or "https"
            host = forwarded_host
            port = f":{forwarded_port}" if forwarded_port and forwarded_port not in ["80", "443"] else ""
            prefix = forwarded_prefix or ""
            
            base_url = f"{scheme}://{host}{port}{prefix}"
        else:
            # No proxy, use request.base_url
            base_url = str(request.base_url)
        
        # Store base_url in request state for templates
        request.state.base_url = base_url.rstrip('/')
        
        # Continue processing
        response = await call_next(request)
        return response