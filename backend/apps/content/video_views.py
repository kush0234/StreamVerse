import os
import re
from django.http import StreamingHttpResponse, HttpResponse, Http404
from django.conf import settings
from wsgiref.util import FileWrapper


def stream_video(request, path):
    """
    Stream video files with support for HTTP Range requests (seeking)
    """
    # Construct the full file path
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise Http404("Video file not found")
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Parse Range header
    range_header = request.META.get('HTTP_RANGE', '').strip()
    range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
    
    # Determine content type
    content_type = 'video/mp4'
    if file_path.endswith('.webm'):
        content_type = 'video/webm'
    elif file_path.endswith('.ogg'):
        content_type = 'video/ogg'
    
    # Handle range request
    if range_match:
        start = int(range_match.group(1))
        end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
        
        # Ensure valid range
        if start >= file_size or end >= file_size or start > end:
            return HttpResponse(status=416)  # Range Not Satisfiable
        
        length = end - start + 1
        
        # Open file and seek to start position
        with open(file_path, 'rb') as f:
            f.seek(start)
            data = f.read(length)
        
        response = HttpResponse(data, status=206, content_type=content_type)
        response['Content-Length'] = str(length)
        response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
        response['Accept-Ranges'] = 'bytes'
        
        return response
    
    # No range request - serve entire file
    response = StreamingHttpResponse(
        FileWrapper(open(file_path, 'rb'), 8192),
        content_type=content_type
    )
    response['Content-Length'] = str(file_size)
    response['Accept-Ranges'] = 'bytes'
    
    return response
