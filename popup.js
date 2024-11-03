function extractPosts() {
  // Helper function to get text content and handle null
  function getTextContent(element) {
    return element ? element.textContent.trim() : "";
  }

  // Main extraction logic
  function extractPostData() {
    const posts = [];
    const postElements = document.querySelectorAll(".feed-shared-update-v2");

    postElements.forEach((post) => {
      // Check if it's a repost by looking for repost indicators
      const isRepost =
        post.querySelector(".feed-shared-actor__description") || // Checks for "reposted" text
        post.querySelector(".feed-shared-actor__sub-description") || // Checks for "Reposted" label
        post.querySelector(".feed-shared-reshared-text") || // Checks for "Shared a post" text
        post.querySelector(".update-components-header__text-view"); // Checks for "Shared a post" text

      // Skip this post if it's a repost
      if (isRepost) {
        return;
      }

      // Extract post text
      const textContent = getTextContent(
        post.querySelector(".tvm-parent-container"),
      );

      // ignore posts with no text or small text
      if (textContent.length < 20) {
        return;
      }

      // Extract engagement metrics
      const reactions = getTextContent(
        post.querySelector(".social-details-social-counts__reactions-count"),
      );
      const comments = getTextContent(
        post.querySelector(".social-details-social-counts__comments"),
      );

      // Extract post URL
      const postLink =
        post.querySelector(".feed-shared-text")?.closest("a")?.href || "";

      // Only add if there's actual content
      if (textContent) {
        posts.push({
          content: textContent,
          reactions: reactions,
          comments: comments,
          url: postLink,
          timestamp: new Date().toISOString(), // Adding timestamp for when the post was extracted
        });
      }
    });

    return posts;
  }

  // Execute extraction
  const extractedPosts = extractPostData();

  // Log the number of posts found (helpful for debugging)
  console.log(`Found ${extractedPosts.length} original posts`);

  // Create and download file
  const blob = new Blob([JSON.stringify(extractedPosts, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `linkedin_posts_${new Date().toISOString().split("T")[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

document.getElementById("extractPosts").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  console.log("extracting posts...");

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractPosts,
  });
});
