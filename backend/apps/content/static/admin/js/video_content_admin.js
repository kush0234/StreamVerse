// Dynamic form behavior for VideoContent admin
(function ($) {
    $(document).ready(function () {
        // Function to toggle field visibility
        function toggleFields() {
            var isPublicDomain = $('#id_is_public_domain').is(':checked');

            if (isPublicDomain) {
                // Show local upload fields
                $('.field-video_file, .field-duration').closest('.form-row').show();
                $('fieldset:contains("Step 4A: Local Video Upload")').show();

                // Hide YouTube fields
                $('.field-youtube_trailer_url').closest('.form-row').hide();
                $('fieldset:contains("Step 4B: YouTube Trailer")').hide();

                // Clear YouTube URL when switching to local
                $('#id_youtube_trailer_url').val('');
            } else {
                // Show YouTube fields
                $('.field-youtube_trailer_url').closest('.form-row').show();
                $('fieldset:contains("Step 4B: YouTube Trailer")').show();

                // Hide local upload fields
                $('.field-video_file, .field-duration').closest('.form-row').hide();
                $('fieldset:contains("Step 4A: Local Video Upload")').hide();

                // Clear local file when switching to YouTube
                $('#id_video_file').val('');
                $('#id_duration').val('');
            }
        }

        // Initial toggle
        toggleFields();

        // Toggle on checkbox change
        $('#id_is_public_domain').change(toggleFields);

        // Add helpful tooltips
        $('#id_is_public_domain').after('<p class="help">💡 <strong>Tip:</strong> Check this box if you want to upload a local video file. Uncheck to use YouTube trailer instead.</p>');
    });
})(django.jQuery);