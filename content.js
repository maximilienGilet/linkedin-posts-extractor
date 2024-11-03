function extractPosts() {
  // Helper function to format date
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString();
  }

  // Helper function to get text content and handle null
  function getTextContent(element) {
    return element ? element.textContent.trim() : "";
  }

  // Main extraction logic
  function extractPostData() {
    const posts = [];
    const postElements = document.querySelectorAll(".feed-shared-update-v2");

    postElements.forEach((post) => {
      // Extract post text
      const textContent = getTextContent(
        post.querySelector(".feed-shared-text"),
      );

      // Extract timestamp
      const timestamp = post.querySelector("time");
      const postDate = timestamp ? formatDate(timestamp.dateTime) : "";

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

      posts.push({
        date: postDate,
        content: textContent,
        reactions: reactions,
        comments: comments,
        url: postLink,
      });
    });

    return posts;
  }

  // Execute extraction
  const extractedPosts = extractPostData();

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
