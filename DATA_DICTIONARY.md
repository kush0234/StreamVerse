# StreamVerse Data Dictionary

## Table of Contents
1. [users_user](#users_user)
2. [users_profile](#users_profile)
3. [users_subscriptionplan](#users_subscriptionplan)
4. [users_subscription](#users_subscription)
5. [users_paymenthistory](#users_paymenthistory)
6. [users_passwordresettoken](#users_passwordresettoken)
7. [content_tag](#content_tag)
8. [content_videocontent](#content_videocontent)
9. [content_episode](#content_episode)
10. [content_music](#content_music)
11. [content_watchhistory](#content_watchhistory)
12. [content_watchlist](#content_watchlist)
13. [content_userinteraction](#content_userinteraction)
14. [content_contentsimilarity](#content_contentsimilarity)
15. [feedback_feedbackcategory](#feedback_feedbackcategory)
16. [feedback_feedback](#feedback_feedback)
17. [feedback_feedbackvote](#feedback_feedbackvote)
18. [feedback_feedbackcomment](#feedback_feedbackcomment)
19. [feedback_feedbackattachment](#feedback_feedbackattachment)
20. [admin_dashboard_activitylog](#admin_dashboard_activitylog)

---

## users_user

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| username | VARCHAR(150) | Unique, Not Null | Login username |
| email | VARCHAR(254) | Not Null | User email address |
| password | VARCHAR(128) | Not Null | Hashed password |
| first_name | VARCHAR(150) | Optional | First name |
| last_name | VARCHAR(150) | Optional | Last name |
| role | VARCHAR(20) | Not Null, Default='USER' | USER / ADMIN / SUPERADMIN |
| is_active | Boolean | Default=True | Account active status |
| is_staff | Boolean | Default=False | Staff access flag |
| date_joined | DateTime | Auto | Account creation timestamp |

---

## users_profile

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| user_id | Integer | FK → users_user, Not Null | Owner user |
| name | VARCHAR(50) | Not Null | Profile display name |
| profile_image | VARCHAR | Optional | Cloudinary image URL |
| maturity_level | VARCHAR(10) | Default='ADULT' | KIDS / ADULT |
| created_at | DateTime | Auto | Creation timestamp |
| — | — | Unique(user, name) | One profile name per user |

---

## users_subscriptionplan

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| name | VARCHAR(50) | Unique, Not Null | BASIC / STANDARD / PREMIUM |
| display_name | VARCHAR(100) | Not Null | Human-readable plan name |
| description | Text | Not Null | Plan description |
| monthly_price | Decimal(10,2) | Not Null | Monthly price in INR |
| yearly_price | Decimal(10,2) | Not Null | Yearly price in INR |
| max_profiles | Integer | Default=2 | Max profiles allowed |
| max_simultaneous_streams | Integer | Default=1 | Concurrent streams allowed |
| video_quality | VARCHAR(20) | Default='SD' | SD / HD / 4K |
| has_ads | Boolean | Default=True | Whether plan has ads |
| can_download | Boolean | Default=False | Download permission |
| priority_support | Boolean | Default=False | Priority support flag |
| is_active | Boolean | Default=True | Plan availability |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Last update timestamp |

---

## users_subscription

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| user_id | Integer | FK → users_user, OneToOne | Subscribed user |
| plan_id | Integer | FK → users_subscriptionplan | Subscribed plan |
| billing_cycle | VARCHAR(20) | Default='MONTHLY' | MONTHLY / YEARLY |
| status | VARCHAR(20) | Default='ACTIVE' | ACTIVE / CANCELLED / EXPIRED / TRIAL |
| start_date | DateTime | Not Null | Subscription start date |
| end_date | DateTime | Not Null | Subscription end date |
| trial_end_date | DateTime | Optional | Trial period end date |
| auto_renew | Boolean | Default=True | Auto renewal flag |
| last_payment_date | DateTime | Optional | Last payment timestamp |
| next_billing_date | DateTime | Optional | Next billing timestamp |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Last update timestamp |

---

## users_paymenthistory

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| user_id | Integer | FK → users_user, Not Null | Paying user |
| subscription_id | Integer | FK → users_subscription, Optional | Related subscription |
| amount | Decimal(10,2) | Not Null | Payment amount |
| currency | VARCHAR(3) | Default='INR' | Currency code |
| payment_method | VARCHAR(20) | Not Null | CARD / UPI / NETBANKING / WALLET |
| payment_status | VARCHAR(20) | Default='PENDING' | INITIATED / PENDING / SUCCESS / FAILED / REFUNDED |
| transaction_id | VARCHAR(200) | Unique, Optional | Payment transaction ID |
| razorpay_order_id | VARCHAR(200) | Optional | Razorpay order ID |
| razorpay_payment_id | VARCHAR(200) | Optional | Razorpay payment ID |
| razorpay_signature | VARCHAR(500) | Optional | Razorpay signature |
| payment_gateway_response | JSON | Optional | Raw gateway response |
| created_at | DateTime | Auto | Payment timestamp |
| updated_at | DateTime | Auto | Last update timestamp |

---

## users_passwordresettoken

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| user_id | Integer | FK → users_user, Not Null | Token owner |
| token | UUID | Unique, Not Null | Reset token value |
| created_at | DateTime | Auto | Token creation time |
| is_used | Boolean | Default=False | Whether token was used |

---

## content_tag

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| name | VARCHAR(100) | Unique, Not Null | Tag name |
| slug | SlugField(100) | Unique | URL-friendly tag name |
| category | VARCHAR(20) | Default='OTHER' | GENRE / MOOD / THEME / ERA / DURATION / OTHER |
| auto_generated | Boolean | Default=False | Whether tag was auto-generated |
| usage_count | Integer | Default=0 | Number of time
RCHAR(20) | Not Null | MOVIE / SERIES |
| thumbnail | VARCHAR | Optional | Cloudinary thumbnail URL |
| video_url | VARCHAR | Optional | Cloudinary video URL |
| trailer_url | VARCHAR | Optional | Cloudinary trailer URL |
| youtube_trailer_url | URL | Optional | YouTube embed URL |
| duration | Integer | Optional | Duration in minutes |
| view_count | Integer | Default=0 | Total view count |
| is_coming_soon | Boolean | Default=False | Coming soon flag |
| expected_release_date | Date | Optional | Expected release for coming soon |
| approval_status | VARCHAR(20) | Default='APPROVED' | PENDING / APPROVED / REJECTED / NEEDS_CHANGES |
| submitted_for_approval_at | DateTime | Optional | Approval submission timestamp |
| created_at | DateTime | Auto | Creation timestamp |

---

## content_episode

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| series_id | Integer | FK → content_videocontent, Not Null | Parent series |
| season_number | Integer | Not Null | Season number |
| episode_number | Integer | Not Null | Episode number |
| title | VARCHAR(200) | Not Null | Episode title |
| description | Text | Optional | Episode description |
| video_url | VARCHAR | Optional | Cloudinary video URL |
| thumbnail | VARCHAR | Optional | Cloudinary thumbnail URL |
| duration | Integer | Optional | Duration in minutes |
| approval_status | VARCHAR(20) | Default='PENDING' | PENDING / APPROVED / REJECTED |
| — | — | Unique(series, season, episode) | No duplicate episodes |

---

## content_music

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| title | VARCHAR(200) | Not Null | Track title |
| artist | VARCHAR(200) | Not Null | Artist name |
| album | VARCHAR(200) | Optional | Album name |
| genre | VARCHAR(100) | Not Null | Music genre |
| release_date | Date | Not Null | Release date |
| audio_file | VARCHAR | Optional | Cloudinary audio URL |
| duration | Integer | Default=0 | Duration in seconds |
| play_count | Integer | Default=0 | Total play count |
| created_at | DateTime | Auto | Creation timestamp |

---

## content_watchhistory

Unified history table for both video watch progress and music listen history.

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| user_id | Integer | FK → users_user, Not Null | User who watched/listened |
| profile_id | Integer | FK → users_profile, Not Null | Active profile |
| media_type | VARCHAR(10) | Not Null, Default='VIDEO' | VIDEO / MUSIC |
| video_id | Integer | FK → content_videocontent, Optional | Watched video |
| episode_id | Integer | FK → content_episode, Optional | Watched episode |
| music_id | Integer | FK → content_music, Optional | Listened music track |
| duration_watched | Integer | Default=0 | Seconds watched or listened |
| completed | Boolean | Default=False | Whether fully watched/listened |
| play_count | Integer | Default=1 | Number of plays (mainly for music) |
| created_at | DateTime | Auto, Optional | First watch/listen timestamp |
| updated_at | DateTime | Auto | Last watch/listen timestamp |

---

## content_watchlist

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| user_id | Integer | FK → users_user, Not Null | User who added |
| profile_id | Integer | FK → users_profile, Not Null | Active profile |
| video_id | Integer | FK → content_videocontent, Optional | Watchlisted video |
| music_id | Integer | FK → content_music, Optional | Watchlisted music |
| added_at | DateTime | Auto | When item was added |
| — | — | Unique(profile, video) | No duplicate video entries |
| — | — | Unique(profile, music) | No duplicate music entries |

---

## content_userinteraction

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| user_id | Integer | FK → users_user, Not Null | Interacting user |
| profile_id | Integer | FK → users_profile, Not Null | Active profile |
| video_id | Integer | FK → content_videocontent, Optional | Related video |
| music_id | Integer | FK → content_music, Optional | Related music |
| episode_id | Integer | FK → content_episode, Optional | Related episode |
| interaction_type | VARCHAR(20) | Not Null | VIEW / LIKE / DISLIKE / PLAY / COMPLETE / SHARE / SKIP etc. |
| interaction_value | Float | Default=1.0 | Interaction weight |
| duration | Integer | Default=0 | Interaction duration in seconds |
| session_id | VARCHAR(100) | Optional | Session identifier |
| device_type | VARCHAR(50) | Optional | Device type |
| created_at | DateTime | Auto | Interaction timestamp |

---

## content_contentsimilarity

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| video_a_id | Integer | FK → content_videocontent, Optional | First video |
| video_b_id | Integer | FK → content_videocontent, Optional | Second video |
| music_a_id | Integer | FK → content_music, Optional | First music |
| music_b_id | Integer | FK → content_music, Optional | Second music |
| similarity_type | VARCHAR(20) | Not Null | GENRE / TAG / COLLABORATIVE / HYBRID |
| similarity_score | Float | Not Null | Score between 0.0 and 1.0 |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Last update timestamp |

---

## feedback_feedbackcategory

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| name | VARCHAR(100) | Unique, Not Null | Category name |
| slug | SlugField(100) | Unique, Not Null | URL-friendly name |
| description | Text | Optional | Category description |
| icon | VARCHAR(10) | Default='💬' | Emoji icon |
| color | VARCHAR(20) | Default='blue' | Display color |
| is_active | Boolean | Default=True | Active status |
| created_at | DateTime | Auto | Creation timestamp |

---

## feedback_feedback

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| user_id | Integer | FK → users_user, Not Null | Feedback author |
| category_id | Integer | FK → feedback_feedbackcategory, Optional | Feedback category |
| assigned_to_id | Integer | FK → users_user, Optional | Assigned admin |
| title | VARCHAR(200) | Not Null | Feedback title |
| description | Text | Not Null | Feedback details |
| status | VARCHAR(20) | Default='SUBMITTED' | SUBMITTED / UNDER_REVIEW / IN_PROGRESS / COMPLETED / CLOSED / REJECTED |
| priority | VARCHAR(20) | Default='MEDIUM' | LOW / MEDIUM / HIGH / CRITICAL |
| upvotes | Integer | Default=0 | Upvote count |
| downvotes | Integer | Default=0 | Downvote count |
| admin_response | Text | Optional | Public admin response |
| admin_notes | Text | Optional | Internal admin notes |
| is_public | Boolean | Default=True | Public visibility |
| is_pinned | Boolean | Default=False | Pinned status |
| views_count | Integer | Default=0 | View count |
| created_at | DateTime | Auto | Submission timestamp |
| updated_at | DateTime | Auto | Last update timestamp |
| resolved_at | DateTime | Optional | Resolution timestamp |

---

## feedback_feedbackvote

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| feedback_id | Integer | FK → feedback_feedback, Not Null | Voted feedback |
| user_id | Integer | FK → users_user, Not Null | Voting user |
| vote_type | VARCHAR(4) | Not Null | UP / DOWN |
| created_at | DateTime | Auto | Vote timestamp |
| — | — | Unique(feedback, user) | One vote per user per feedback |

---

## feedback_feedbackcomment

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| feedback_id | Integer | FK → feedback_feedback, Not Null | Parent feedback |
| user_id | Integer | FK → users_user, Not Null | Comment author |
| comment | Text | Not Null | Comment content |
| is_admin | Boolean | Default=False | Whether posted by admin |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Last update timestamp |

---

## feedback_feedbackattachment

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| feedback_id | Integer | FK → feedback_feedback, Not Null | Parent feedback |
| file | FileField | Not Null | Uploaded file |
| file_name | VARCHAR(255) | Not Null | Original file name |
| file_type | VARCHAR(50) | Not Null | MIME type |
| file_size | Integer | Not Null | File size in bytes |
| uploaded_at | DateTime | Auto | Upload timestamp |

---

## admin_dashboard_activitylog

| Field | Data Type | Constraint | Description |
|-------|-----------|------------|-------------|
| id | Integer | PK, Auto | Primary key |
| user_id | Integer | FK → users_user, Optional | User who performed action |
| activity_type | VARCHAR(50) | Not Null | USER_REGISTERED / VIDEO_UPLOADED / PAYMENT_SUCCESS etc. |
| description | Text | Not Null | Human-readable description |
| metadata | JSON | Default={} | Additional activity data |
| ip_address | GenericIPAddress | Optional | Client IP address |
| user_agent | Text | Optional | Browser/client info |
| created_at | DateTime | Auto | Activity timestamp |
