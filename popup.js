function extractPosts(minImpressions = 0) {
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

  // Helper function to create custom date formats
  function formatDate(date, formatString) {
    if (!(date instanceof Date)) {
      return "Invalid Date"; // Or handle the error as you see fit
    }
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = String(hours % 12 || 12).padStart(2, '0'); // 12-hour format
  
    const replacements = {
      YYYY: year,
      YY: String(year).slice(-2),
      MM: month,
      M: String(parseInt(month)), // month without leading zero
      DD: day,
      D: String(parseInt(day)), // day without leading zero
      HH: hours,
      H: String(parseInt(hours)), // hours without leading zero
      hh: hours12,
      h: String(parseInt(hours12)), // hours without leading zero
      mm: minutes,
      m: String(parseInt(minutes)), // minutes without leading zero
      ss: seconds,
      s: String(parseInt(seconds)), // seconds without leading zero
      SSS: milliseconds,
      A: ampm,
      a: ampm.toLowerCase(),
    };

    let formattedString = formatString;
    for (const [key, value] of Object.entries(replacements)) {
      formattedString = formattedString.replace(new RegExp(key, 'g'), value);
    }

    return formattedString;
  }

  // Helper function to get Unix Timestamp from post ID
  function getUnixTimestamp(postId) {
    if(postId == null) {
      return "";
    }
    const binString = BigInt(postId).toString(2);
    const trimmedChars = binString.slice(0, 41);
    const timestamp = parseInt(trimmedChars, 2);
    return timestamp; 
  }

  // Helper function to extract date
  function extractPostDate(postUrn) {
    const regex = /urn:li:activity:(\d+)/;
    const match = regex.exec(postUrn);
    if (match) {
      const postId = match[1];
      const unixTimestamp = getUnixTimestamp(postId);
      const date = new Date(unixTimestamp);
      return formatDate(date, "YYYY-MM-DD hh:mm:ss A");
    }
    else {
      return postUrn;
    }
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

      // Extract post URN and construct URL
      const postUrn = post.getAttribute("data-urn");
      const postUrl = postUrn
        ? `https://www.linkedin.com/feed/update/${postUrn}`
        : "";

      // extract date
      const postDate = extractPostDate(postUrn);
      
      // Only add if there's actual content and meets minimum impressions
      if (textContent && impressions >= minImpressions) {
        posts.push({
          post_date: postDate,
          content: textContent,
          reactions: reactions,
          comments: comments,
          impressions: impressions,
          url: postUrl,
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
  const minImpressions =
    parseInt(document.getElementById("minImpressions").value) || 0;

  console.log("extracting posts with minimum impressions:", minImpressions);

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractPosts,
    args: [minImpressions],
  });
});
