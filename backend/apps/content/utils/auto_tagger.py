"""
Auto-tagging utility for content
Automatically generates tags based on content metadata
"""
import re
from datetime import datetime
from apps.content.models import Tag


class AutoTagger:
    """Automatically generate tags for video content"""
    
    # Predefined tag mappings
    GENRE_TAGS = {
        'action': ['Action', 'Thriller'],
        'comedy': ['Comedy', 'Funny', 'Humor'],
        'drama': ['Drama', 'Emotional'],
        'horror': ['Horror', 'Scary', 'Suspense'],
        'romance': ['Romance', 'Love Story'],
        'sci-fi': ['Sci-Fi', 'Science Fiction', 'Futuristic'],
        'fantasy': ['Fantasy', 'Magic'],
        'documentary': ['Documentary', 'Educational'],
        'animation': ['Animation', 'Animated'],
        'thriller': ['Thriller', 'Suspense'],
        'mystery': ['Mystery', 'Detective'],
        'adventure': ['Adventure', 'Exploration'],
        'crime': ['Crime', 'Investigation'],
        'family': ['Family', 'Family-Friendly'],
        'musical': ['Musical', 'Music'],
    }
    
    MOOD_KEYWORDS = {
        'dark': 'Dark',
        'light': 'Light-hearted',
        'intense': 'Intense',
        'emotional': 'Emotional',
        'inspiring': 'Inspiring',
        'uplifting': 'Uplifting',
        'heartwarming': 'Heartwarming',
        'gripping': 'Gripping',
    }
    
    THEME_KEYWORDS = {
        'war': 'War',
        'space': 'Space',
        'superhero': 'Superhero',
        'zombie': 'Zombie',
        'vampire': 'Vampire',
        'time travel': 'Time Travel',
        'alien': 'Alien',
        'robot': 'Robot',
        'detective': 'Detective',
        'spy': 'Spy',
        'heist': 'Heist',
        'survival': 'Survival',
    }
    
    @staticmethod
    def generate_tags(video_content):
        """
        Generate tags for a video content object
        Returns a list of Tag objects
        """
        tags = []
        
        # 1. Genre-based tags
        genre_tags = AutoTagger._extract_genre_tags(video_content.genre)
        tags.extend(genre_tags)
        
        # 2. Title and description keyword tags
        text = f"{video_content.title} {video_content.description}".lower()
        keyword_tags = AutoTagger._extract_keyword_tags(text)
        tags.extend(keyword_tags)
        
        # 3. Era tags based on release date
        era_tags = AutoTagger._extract_era_tags(video_content.release_date)
        tags.extend(era_tags)
        
        # 4. Duration tags
        if video_content.duration:
            duration_tags = AutoTagger._extract_duration_tags(video_content.duration)
            tags.extend(duration_tags)
        
        # 5. Content type tags
        content_type_tag = AutoTagger._get_or_create_tag(
            video_content.get_content_type_display(),
            'GENRE'
        )
        tags.append(content_type_tag)
        
        # Remove duplicates
        unique_tags = list(set(tags))
        
        return unique_tags
    
    @staticmethod
    def _extract_genre_tags(genre):
        """Extract tags from genre field"""
        tags = []
        genre_lower = genre.lower()
        
        for key, tag_names in AutoTagger.GENRE_TAGS.items():
            if key in genre_lower:
                for tag_name in tag_names:
                    tag = AutoTagger._get_or_create_tag(tag_name, 'GENRE', auto_generated=True)
                    tags.append(tag)
        
        # Also add the genre itself as a tag
        genre_tag = AutoTagger._get_or_create_tag(genre, 'GENRE', auto_generated=True)
        tags.append(genre_tag)
        
        return tags
    
    @staticmethod
    def _extract_keyword_tags(text):
        """Extract tags from title and description"""
        tags = []
        
        # Check mood keywords
        for keyword, tag_name in AutoTagger.MOOD_KEYWORDS.items():
            if keyword in text:
                tag = AutoTagger._get_or_create_tag(tag_name, 'MOOD', auto_generated=True)
                tags.append(tag)
        
        # Check theme keywords
        for keyword, tag_name in AutoTagger.THEME_KEYWORDS.items():
            if keyword in text:
                tag = AutoTagger._get_or_create_tag(tag_name, 'THEME', auto_generated=True)
                tags.append(tag)
        
        return tags
    
    @staticmethod
    def _extract_era_tags(release_date):
        """Extract era tags based on release date"""
        tags = []
        year = release_date.year
        
        if year < 1960:
            tag_name = 'Classic'
        elif year < 1980:
            tag_name = '60s-70s'
        elif year < 1990:
            tag_name = '80s'
        elif year < 2000:
            tag_name = '90s'
        elif year < 2010:
            tag_name = '2000s'
        elif year < 2020:
            tag_name = '2010s'
        else:
            tag_name = '2020s'
        
        tag = AutoTagger._get_or_create_tag(tag_name, 'ERA', auto_generated=True)
        tags.append(tag)
        
        return tags
    
    @staticmethod
    def _extract_duration_tags(duration_seconds):
        """Extract duration tags based on video length"""
        tags = []
        duration_minutes = duration_seconds / 60
        
        if duration_minutes < 30:
            tag_name = 'Short'
        elif duration_minutes < 90:
            tag_name = 'Standard Length'
        else:
            tag_name = 'Feature Length'
        
        tag = AutoTagger._get_or_create_tag(tag_name, 'DURATION', auto_generated=True)
        tags.append(tag)
        
        return tags
    
    @staticmethod
    def _get_or_create_tag(name, category='OTHER', auto_generated=False):
        """Get or create a tag"""
        tag, created = Tag.objects.get_or_create(
            name=name,
            defaults={
                'category': category,
                'auto_generated': auto_generated
            }
        )
        return tag
    
    @staticmethod
    def apply_tags_to_content(video_content):
        """
        Generate and apply tags to video content
        Returns the list of applied tags
        """
        tags = AutoTagger.generate_tags(video_content)
        
        # Clear existing auto-generated tags
        video_content.tags.filter(auto_generated=True).delete()
        
        # Add new tags
        video_content.tags.add(*tags)
        
        # Update usage count for each tag
        for tag in tags:
            tag.usage_count = tag.videos.count()
            tag.save()
        
        return tags
