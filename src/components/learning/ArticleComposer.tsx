import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowLeft, ArrowRight, BookOpen, FileText, Pencil } from "lucide-react";
import type { LearningArticle, LearningArticleStatus, LearningCategory, LearningTopic } from "../../features/admin/api/types";
import "./learning-article.css";

export type ArticleDraftForm = {
  title: string;
  summary: string;
  content: string;
  topic: string;
  content_type: LearningArticle["content_type"];
  status: LearningArticleStatus;
  reading_time_minutes: number;
};

type ArticleComposerProps = {
  mode: "new-article" | "edit-article";
  article?: LearningArticle | null;
  categoryName: string;
  topicName: string;
  categories: LearningCategory[];
  topics: LearningTopic[];
  categoryId: string;
  draft: ArticleDraftForm;
  setCategoryId: Dispatch<SetStateAction<string>>;
  setDraft: Dispatch<SetStateAction<ArticleDraftForm>>;
  onSave: (publish: boolean) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
};

/** Article create/edit experience. All editorial values come from form input or backend records. */
export function ArticleComposer({
  mode, article, categoryName, topicName, categories, topics, categoryId,
  draft, setCategoryId, setDraft, onSave, onCancel, saving, error,
}: ArticleComposerProps) {
  const [preview, setPreview] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const isNew = mode === "new-article";
  const wordCount = draft.content.trim().split(/\s+/).filter(Boolean).length;

  /** Apply lightweight Markdown around the user's current text selection. */
  function insertMarkdown(before: string, after = before) {
    const editor = contentRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = draft.content.slice(start, end) || "text";
    const replacement = `${before}${selectedText}${after}`;
    setDraft((current) => ({
      ...current,
      content: `${current.content.slice(0, start)}${replacement}${current.content.slice(end)}`,
    }));
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    });
  }

  return <>
    <div className="learning-breadcrumb"><button type="button" onClick={onCancel}><ArrowLeft /> Back to Articles</button><span>Learning / {categoryName || "Category"} / {topicName || "Topic"} / <b>{isNew ? "New Article" : "Edit Article"}</b></span></div>
    <div className="learning-editor-heading"><h1>{isNew ? "Create Article" : "Edit Article"}</h1><div>
      {isNew ? <>
        <button type="button" className="learning-secondary" disabled={saving} onClick={() => onSave(false)}><FileText /> {saving ? "Saving…" : "Save Draft"}</button>
        <button type="button" className="learning-primary" disabled={saving} onClick={() => onSave(true)}><ArrowRight /> {saving ? "Saving…" : "Publish"}</button>
      </> : <>
        <label className="learning-status-select">Status<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as LearningArticleStatus }))}>
          <option value="DRAFT">Draft</option><option value="REVIEW">Under review</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
        </select></label>
        <button type="button" className="learning-primary" disabled={saving} onClick={() => onSave(false)}><FileText /> {saving ? "Saving…" : "Save Changes"}</button>
      </>}
    </div></div>

    <section className="learning-editor-card">
      <div className="learning-editor-section-head"><h2><span>ⓘ</span> Article Information</h2><small><i /> {isNew ? "Changes save when you choose Save Draft or Publish" : `Last updated ${article?.updated_at ? new Date(article.updated_at).toLocaleDateString() : ""}`}</small></div>
      <label className="learning-editor-field">Title <sup>*</sup><input required autoFocus value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Enter article title" /></label>
      <label className="learning-editor-field">Summary<textarea rows={2} value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} placeholder="Briefly summarize this learning material" /></label>
      <div className="learning-editor-selects">
        <label><span>Category</span><select value={categoryId} onChange={(event) => {
          const nextCategory = event.target.value;
          setCategoryId(nextCategory);
          const firstTopic = topics.find((item) => item.category === nextCategory);
          setDraft((current) => ({ ...current, topic: firstTopic?.id ?? "" }));
        }}><option value="">Select a category</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label><span>Topic</span><select required value={draft.topic} onChange={(event) => {
          const selectedTopic = topics.find((item) => item.id === event.target.value);
          setDraft((current) => ({ ...current, topic: event.target.value }));
          if (selectedTopic) setCategoryId(selectedTopic.category);
        }}><option value="">Select a topic</option>{topics.filter((item) => !categoryId || item.category === categoryId).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label><span>Content type <sup>*</sup></span><select required value={draft.content_type} onChange={(event) => setDraft((current) => ({ ...current, content_type: event.target.value as LearningArticle["content_type"] }))}><option value="TEXT">Text</option><option value="INFOGRAPHIC">Infographic</option><option value="VIDEO">Video</option><option value="INTERACTIVE">Interactive guide</option></select></label>
      </div>

      <section className="learning-editor-content">
        <div className="learning-editor-section-head"><h2><span>▤</span> Article Content</h2><small>Markdown supported</small></div>
        <div className="learning-markdown-toolbar">
          <button type="button" aria-label="Bold" onClick={() => insertMarkdown("**")}><b>B</b></button>
          <button type="button" aria-label="Italic" onClick={() => insertMarkdown("*")}><i>I</i></button>
          <button type="button" aria-label="Heading 1" onClick={() => insertMarkdown("# ", "")}>H1</button>
          <button type="button" aria-label="Heading 2" onClick={() => insertMarkdown("## ", "")}>H2</button>
          <button type="button" aria-label="Bullet list" onClick={() => insertMarkdown("- ", "")}>•</button>
          <button type="button" aria-label="Numbered list" onClick={() => insertMarkdown("1. ", "")}>1.</button>
          <button type="button" aria-label="Quote" onClick={() => insertMarkdown("> ", "")}>❞</button>
          <div className="learning-editor-mode"><button type="button" className={!preview ? "active" : ""} onClick={() => setPreview(false)}><Pencil /> Edit</button><button type="button" className={preview ? "active" : ""} onClick={() => setPreview(true)}><BookOpen /> Preview</button></div>
        </div>
        {preview ? <div className="learning-markdown-preview">{draft.content || "Your article preview will appear here."}</div> : <textarea ref={contentRef} className="learning-markdown-input" required value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} placeholder="Write the article content using Markdown…" />}
        <footer className="learning-editor-metrics"><span><FileText /> <b>{wordCount}</b> words <i>·</i> {draft.content.length} characters <i>·</i> {Math.max(1, Math.ceil(wordCount / 200))} min read</span><span>{draft.content ? "Content entered" : "No content yet"}</span></footer>
      </section>
      {error && <p className="learning-inline-error" role="alert">{error}</p>}
      <footer className="learning-editor-footer"><span>Visibility follows the article publication status and Learning Center access rules.</span><div><button type="button" className="learning-secondary" onClick={onCancel}>Discard Changes</button><button type="button" className="learning-secondary" onClick={() => setPreview((current) => !current)}><BookOpen /> {preview ? "Back to Editor" : "Live Preview"}</button></div></footer>
    </section>
  </>;
}
