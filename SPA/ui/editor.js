export function initCommentEditor() {
  const container = document.getElementById("comment-input");
  if (!container || window.commentEditor) return;
  
  window.commentEditor = new Quill('#comment-input', {
    theme: 'snow',
    placeholder: 'Add a comment...',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        ['link', 'blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['clean']
      ]
    }
  });
}
