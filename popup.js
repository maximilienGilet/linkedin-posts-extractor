function extractPosts() {
  // Helper function to get text content and handle null
  function getTextContent(element) {
    if (!element) return "";

    // Convert <br> tags to newline characters
    const html = element.innerHTML;
    const withLineBreaks = html.replace(/<br\s*\/?>/gi, "\n");

    // Create a temporary div to handle the HTML to text conversion
    const temp = document.createElement("div");
    temp.innerHTML = withLineBreaks;

    // Get text content while preserving line breaks
    const paragraphs = temp.querySelectorAll("p, span, div");
    if (paragraphs.length > 0) {
      return Array.from(paragraphs)
        .map((p) => p.textContent.trim())
        .filter((text) => text) // Remove empty lines
        .join("\n");
    }

    return temp.textContent.trim();
  }

  // Helper function to extract number from string (e.g., "1,234 views" → 1234)
  function extractNumber(text) {
    if (!text) return 0;
    // Remove all spaces and commas between digits
    const cleanedText = text.replace(/(\d)[,\s](?=\d)/g, "$1");
    // Find the first sequence of digits
    const matches = cleanedText.match(/\d+/);
    return matches ? parseInt(matches[0]) : 0;
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

      // Extract post text with preserved line breaks
      const textContent = getTextContent(
        post.querySelector(".tvm-parent-container"),
      );

      // ignore posts with no text or small text
      if (textContent.length < 100) {
        return;
      }

      // Extract engagement metrics
      const reactions = extractNumber(
        getTextContent(
          post.querySelector(".social-details-social-counts__reactions-count"),
        ),
      );

      const comments = extractNumber(
        getTextContent(
          post.querySelector(".social-details-social-counts__comments"),
        ),
      );

      // Extract impressions (views)
      const impressionsElement = post.querySelector(
        ".ca-entry-point__num-views",
      );
      const impressions = impressionsElement
        ? extractNumber(impressionsElement.textContent)
        : 0;

      // Only add if there's actual content
      if (textContent) {
        posts.push({
          content: textContent,
          reactions: reactions,
          comments: comments,
          impressions: impressions,
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
