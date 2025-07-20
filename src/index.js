require('dotenv').config();

const axios = require('axios');
const { API_KEY, ACCESS_TOKEN } = process.env;

async function getUserInfo() {

    try {

        const res = await axios.get('https://disqus.com/api/3.0/users/details.json', {
            params: {
                api_key: API_KEY,
                access_token: ACCESS_TOKEN,
            }
        });

        return res.data.response;

    } catch (err) {

        console.error('❌ Failed to get user ID:', err.response?.data || err.message);

        process.exit(1);

    }

}

async function fetchUserPosts(user, cursor = '') {

    try {

        const res = await axios.get('https://disqus.com/api/3.0/users/listPosts.json', {
            params: {
                api_key: API_KEY,
                access_token: ACCESS_TOKEN,
                user: user,
                limit: 100,
                cursor: cursor,
                include: ['unapproved', 'approved', 'spam', 'flagged', 'highlighted'] // unapproved, approved, spam, deleted, flagged, highlighted
            }
        });

        return res.data;

    } catch (err) {

        console.error('❌ Failed to fetch posts:', err.response?.data || err.message);

        return null;

    }

}

async function deletePost(postId) {

    try {

        const res = await axios.post('https://disqus.com/api/3.0/posts/remove.json', null, {
            params: {
                api_key: API_KEY,
                access_token: ACCESS_TOKEN,
                post: postId
            }
        });

        console.log(`Deleted post ID: ${postId}`);

    } catch (err) {

        console.error(`❌ Failed to delete post ${postId}:`, err.response?.data || err.message);

    }

}

(async () => {

    const { id } = await getUserInfo();

    let cursor = '';
    let hasNext = true;
    let deleted = 0;

    while (hasNext) {

        const data = await fetchUserPosts(id, cursor);

        if (!data) {
            break;
        }

        const posts = data.response;

        console.log(`Found ${posts.length} posts.`)

        for (const post of posts) {
            
            await deletePost(post.id);
            await new Promise((r) => setTimeout(r, 100)); // Optional: avoid rate limits
            
            deleted++;

        }

        hasNext = data.cursor?.hasNext;
        cursor = data.cursor?.next;

    }

    console.log(`✅ Finished deleting ${deleted} posts.`);

})();