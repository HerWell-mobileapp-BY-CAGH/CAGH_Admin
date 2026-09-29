import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Bookmark, CheckCircle2, ChevronLeft,
  ChevronRight, FileText, Folder, FolderPlus, MoreVertical,
  Pencil, Plus, Search, Trash2, X,
} from "lucide-react";
import {
  createLearningArticle, createLearningCategory, createLearningTopic, getLearningArticle,
  deleteLearningArticle, deleteLearningCategory, deleteLearningTopic,
  getLearningArticles, getLearningCategories, getLearningTopics,
  updateLearningArticle, updateLearningCategory, updateLearningTopic,
} from "../../features/admin/api/admin-api";
import type {
  LearningArticle, LearningArticleStatus, LearningCategory, LearningTopic,
} from "../../features/admin/api/types";
import { ArticleComposer, type ArticleDraftForm } from "./ArticleComposer";
import "./learning-management.css";
import "./learning-pages.css";

type Entity = "category" | "topic" | "article";
type Screen = "categories" | "category" | "topic" | "article" | "new-article" | "edit-category" | "edit-topic" | "edit-article";
type PendingDelete = { kind: Entity; id: string; name: string };

const PAGE_SIZE = 3;
const ARTICLE_STATUSES: Array<{ value: LearningArticleStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "REVIEW", label: "Under review" },
  { value: "ARCHIVED", label: "Archived" },
];

function slugify(value: string) {
  return value.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function dateLabel(value: string) {
  if (!value) return "Recently updated";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Recently updated" : `Updated ${date.toLocaleDateString()}`;
}

/** Shared, data-backed Learning Center screens used by the admin sidebar. */
export function LearningManagement() {
  const [screen, setScreen] = useState<Screen>("categories");
  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [articles, setArticles] = useState<LearningArticle[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [articleDetail, setArticleDetail] = useState<LearningArticle | null>(null);
  const [dialog, setDialog] = useState<Entity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PendingDelete | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [articleStatus, setArticleStatus] = useState<LearningArticleStatus | "ALL">("ALL");
  const [articleType, setArticleType] = useState<LearningArticle["content_type"] | "ALL">("ALL");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [articleDraft, setArticleDraft] = useState<ArticleDraftForm>({
    title: "", summary: "", content: "", topic: "",
    content_type: "TEXT" as LearningArticle["content_type"],
    status: "DRAFT" as LearningArticleStatus, reading_time_minutes: 3,
  });
  const [draftCategoryId, setDraftCategoryId] = useState("");

  // Start every add form clean, including when the same dialog is reopened.
  useEffect(() => {
    if (dialog) setDescriptionDraft("");
  }, [dialog]);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError(null);
    // Every page is populated exclusively from the Learning Center API.
    Promise.all([getLearningCategories(), getLearningTopics(), getLearningArticles()])
      .then(([categoryResponse, topicResponse, articleResponse]) => {
        if (cancelled) return;
        setCategories(categoryResponse.data);
        setTopics(topicResponse.data);
        setArticles(articleResponse.data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load learning materials.");
      })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [revision]);

  const category = categories.find((item) => item.id === categoryId) ?? null;
  const topic = topics.find((item) => item.id === topicId) ?? null;
  const article = articleDetail?.id === articleId
    ? articleDetail
    : articles.find((item) => item.id === articleId) ?? null;
  const categoryTopics = topics.filter((item) => item.category === categoryId);
  const topicArticles = articles.filter((item) => item.topic === topicId);
  const publishedCount = articles.filter((item) => item.status === "PUBLISHED").length;

  const filteredCategories = useMemo(() => categories.filter((item) =>
    `${item.name} ${item.description} ${item.subtitle_summary}`.toLowerCase().includes(search.toLowerCase())), [categories, search]);
  const filteredTopics = useMemo(() => categoryTopics.filter((item) =>
    `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase())), [categoryTopics, search]);
  const filteredArticles = useMemo(() => topicArticles
    .filter((item) => articleStatus === "ALL" || item.status === articleStatus)
    .filter((item) => articleType === "ALL" || item.content_type === articleType)
    .filter((item) => `${item.title} ${item.summary} ${item.status}`.toLowerCase().includes(search.toLowerCase())),
  [articleStatus, articleType, search, topicArticles]);

  function navigate(next: Screen) {
    setScreen(next);
    setSearch("");
    setPage(1);
    setMenuKey(null);
    setError(null);
    setArticleStatus("ALL");
    setArticleType("ALL");
  }

  function openEntity(kind: Entity, id: string, edit = false) {
    // Each menu's Open action lands on that record's management page; edits
    // remain separate routes so a user can always return to the parent list.
    if (kind === "category") {
      setCategoryId(id);
      navigate(edit ? "edit-category" : "category");
    } else if (kind === "topic") {
      setTopicId(id);
      navigate(edit ? "edit-topic" : "topic");
    } else {
      setArticleId(id);
      if (edit) {
        // Populate edit fields from the fetched article record, without any
        // placeholder content or hard-coded editorial values.
        const selectedArticle = articles.find((item) => item.id === id);
        if (selectedArticle) {
          const selectedTopic = topics.find((item) => item.id === selectedArticle.topic);
          setDraftCategoryId(selectedTopic?.category ?? "");
          setArticleDraft({
            title: selectedArticle.title,
            summary: selectedArticle.summary,
            content: selectedArticle.content,
            topic: selectedArticle.topic,
            content_type: selectedArticle.content_type,
            status: selectedArticle.status,
            reading_time_minutes: selectedArticle.reading_time_minutes,
          });
        }
      } else {
        // The detail route returns the latest article and lets Django record a
        // view, while the table itself remains sourced from the list endpoint.
        const listedArticle = articles.find((item) => item.id === id);
        setArticleDetail(listedArticle ?? null);
        getLearningArticle(id).then((detail) => {
          setArticleDetail(detail);
          setArticles((current) => current.map((item) => item.id === id ? detail : item));
        }).catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : "Unable to load this article.");
        });
      }
      navigate(edit ? "edit-article" : "article");
    }
  }

  /** Start an article in the active topic and clear all editor state. */
  function startCreateArticle() {
    const parentTopic = topicId ?? "";
    setArticleId(null);
    setDraftCategoryId(topics.find((item) => item.id === parentTopic)?.category ?? categoryId ?? "");
    setArticleDraft({
      title: "", summary: "", content: "", topic: parentTopic,
      content_type: "TEXT", status: "DRAFT", reading_time_minutes: 3,
    });
    navigate("new-article");
  }

  /** Persist the editor through POST for new records or PATCH for edits. */
  async function saveArticle(publish: boolean) {
    const selectedTopic = articleDraft.topic;
    if (!articleDraft.title.trim() || !articleDraft.content.trim() || !selectedTopic) {
      setError("Title, topic, and article content are required.");
      return;
    }
    const wordCount = articleDraft.content.trim().split(/\s+/).filter(Boolean).length;
    const status = publish ? "PUBLISHED" : screen === "new-article" ? "DRAFT" : articleDraft.status;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: articleDraft.title.trim(),
        summary: articleDraft.summary.trim(),
        content: articleDraft.content,
        topic: selectedTopic,
        content_type: articleDraft.content_type,
        status,
        reading_time_minutes: Math.max(1, Math.ceil(wordCount / 200)),
      };
      const savedArticle = screen === "edit-article" && articleId
        ? await updateLearningArticle(articleId, payload)
        : await createLearningArticle(payload);
      // Keep the editor's selected hierarchy as the article view destination.
      setArticleId(savedArticle.id);
      setArticleDetail(savedArticle);
      setTopicId(selectedTopic);
      setCategoryId(topics.find((item) => item.id === selectedTopic)?.category ?? draftCategoryId);
      setRevision((current) => current + 1);
      navigate("article");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this article.");
    } finally { setSaving(false); }
  }

  function requestDelete(kind: Entity, id: string, name: string) {
    setDeleteTarget({ kind, id, name });
    setMenuKey(null);
  }

  async function submitEntity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog) return;
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name") ?? "").trim();
    setSaving(true);
    setError(null);
    try {
      if (dialog === "category") {
        await createLearningCategory({
          name, slug: slugify(name), description: String(values.get("description") ?? "").trim(),
          subtitle_summary: String(values.get("description") ?? "").trim(),
          icon: "book-open", order: categories.length,
        });
      } else if (dialog === "topic") {
        // The category is captured by the page context, never trusted from a
        // hidden client field, and travels with the topic creation request.
        await createLearningTopic({
          name, slug: slugify(name), description: String(values.get("description") ?? "").trim(),
          category: categoryId ?? "", icon: "circle-dot", order: categoryTopics.length,
        });
      } else {
        await createLearningArticle({
          title: name, summary: String(values.get("summary") ?? "").trim(),
          content: String(values.get("content") ?? "").trim(), topic: topicId ?? "",
          content_type: "TEXT", status: String(values.get("status") ?? "DRAFT") as LearningArticleStatus,
          reading_time_minutes: Math.max(1, Number(values.get("reading_time_minutes") ?? 3)),
          cover_image: "", key_takeaway_tip: "", sections: [], next_article: null,
        });
      }
      setDialog(null);
      setRevision((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save learning material.");
    } finally { setSaving(false); }
  }

  async function saveEditedEntity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    try {
      if (screen === "edit-category" && category) {
        const name = String(values.get("name") ?? "").trim();
        await updateLearningCategory(category.id, {
          name, slug: slugify(name), description: String(values.get("description") ?? "").trim(),
          subtitle_summary: String(values.get("description") ?? "").trim(),
        });
        navigate("category");
      } else if (screen === "edit-topic" && topic) {
        const name = String(values.get("name") ?? "").trim();
        await updateLearningTopic(topic.id, {
          name, slug: slugify(name), category: String(values.get("category") ?? topic.category),
          description: String(values.get("description") ?? "").trim(),
          icon: String(values.get("icon") ?? topic.icon),
          order: Math.max(0, Number(values.get("order") ?? topic.order)),
        });
        navigate("topic");
      } else if (screen === "edit-article" && article) {
        const nextTopicId = String(values.get("topic") ?? article.topic);
        await updateLearningArticle(article.id, {
          title: String(values.get("name") ?? "").trim(),
          summary: String(values.get("summary") ?? "").trim(),
          content: String(values.get("content") ?? "").trim(),
          topic: nextTopicId,
          status: String(values.get("status") ?? article.status) as LearningArticleStatus,
          reading_time_minutes: Math.max(1, Number(values.get("reading_time_minutes") ?? article.reading_time_minutes)),
        });
        // If the article was reclassified, keep its Open destination in the
        // new topic and category context after the refreshed response arrives.
        setTopicId(nextTopicId);
        setCategoryId(topics.find((entry) => entry.id === nextTopicId)?.category ?? categoryId);
        navigate("article");
      }
      setRevision((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update learning material.");
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setSaving(true);
    setError(null);
    try {
      // Delete only after explicit confirmation; the backend enforces the
      // category/topic cascade and the list is reloaded after success.
      if (target.kind === "category") await deleteLearningCategory(target.id);
      else if (target.kind === "topic") await deleteLearningTopic(target.id);
      else await deleteLearningArticle(target.id);
      if (target.kind === "category") navigate("categories");
      else if (target.kind === "topic") navigate("category");
      else navigate("topic");
      setDeleteTarget(null);
      setRevision((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete learning material.");
    } finally { setSaving(false); }
  }

  const paginated = <T,>(items: T[]) => {
    const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    return { pages, current, items: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) };
  };

  function pager(total: number, noun: string, pages: number, current: number) {
    const first = total === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
    const last = Math.min(total, current * PAGE_SIZE);
    return <footer className="learning-pager"><span>Showing <b>{first}–{last}</b> of <b>{total}</b> {noun}</span><div>
      <button aria-label="Previous page" disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft /></button>
      {Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button key={number} className={current === number ? "current" : ""} onClick={() => setPage(number)}>{number}</button>)}
      <button aria-label="Next page" disabled={current >= pages} onClick={() => setPage(current + 1)}><ChevronRight /></button>
    </div></footer>;
  }

  function menu(kind: Entity, id: string, name: string) {
    const key = `${kind}:${id}`;
    return <div className="learning-menu-wrap"><button className="learning-icon-button" aria-label={`Actions for ${name}`} aria-expanded={menuKey === key} onClick={() => setMenuKey(menuKey === key ? null : key)}><MoreVertical /></button>
      {menuKey === key && <div className="learning-menu" role="menu">
        <button role="menuitem" onClick={() => openEntity(kind, id)}><ArrowRight /> Open</button>
        <button role="menuitem" onClick={() => openEntity(kind, id, true)}><Pencil /> Edit</button>
        <button role="menuitem" className="delete-item" onClick={() => requestDelete(kind, id, name)}><Trash2 /> Delete</button>
      </div>}
    </div>;
  }

  function sectionHeader(title: string, subtitle: string, addLabel?: string, addKind?: Entity) {
    return <div className="learning-card-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><div className="learning-tools">
      <label className="learning-search"><Search /><input placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
      {addLabel && addKind && <button className="learning-secondary" onClick={() => setDialog(addKind)}><Plus />{addLabel}</button>}
    </div></div>;
  }

  const currentEntity = screen === "edit-category" ? category : screen === "edit-topic" ? topic : null;
  if (busy && !categories.length && !topics.length && !articles.length) return <div className="learning-page"><p className="learning-message">Loading learning materials…</p></div>;
  if (error && !categories.length && !topics.length && !articles.length) return <div className="learning-page"><p role="alert" className="learning-message error">{error}</p><button className="learning-primary" onClick={() => setRevision((current) => current + 1)}>Retry</button></div>;

  return <div className="learning-page" onClick={() => menuKey && setMenuKey(null)}>
    {error && !dialog && !deleteTarget && screen !== "new-article" && screen !== "edit-article" && <div className="learning-error" role="alert">{error}<button onClick={() => setError(null)} aria-label="Dismiss error"><X /></button></div>}
    {screen === "categories" && <>
      <div className="learning-page-heading"><div><h1>Learning</h1><p>Manage educational content and organize learning resources.</p></div><button className="learning-primary" onClick={() => setDialog("category")}><Plus /> Add Category</button></div>
      <section className="learning-stats">
        <div><span>Total categories</span><strong>{categories.length}</strong><small><FolderPlus /> Curriculum pillars and patient guides</small><i className="sage"><FolderPlus /></i></div>
        <div><span>Active topics</span><strong>{topics.length}</strong><small><Bookmark /> Across {categories.length} categories</small><i className="lilac"><Folder /></i></div>
        <div><span>Published articles</span><strong>{publishedCount}</strong><small><CheckCircle2 /> Published learning content</small><i className="gold"><BookOpen /></i></div>
      </section>
      <section className="learning-card">
        {sectionHeader("Categories", "Directory of curriculum pillars and patient guides")}
        <div className="learning-table-scroll"><table className="learning-table"><thead><tr><th>Category</th><th>Topics</th><th>Articles</th><th className="actions-col">Actions</th></tr></thead><tbody>
          {paginated(filteredCategories).items.map((item) => {
            const itemTopics = topics.filter((entry) => entry.category === item.id);
            const count = articles.filter((entry) => itemTopics.some((entryTopic) => entryTopic.id === entry.topic)).length;
            return <tr key={item.id} className="learning-clickable-row" onClick={() => openEntity("category", item.id)}><td><div className="learning-record"><span className="learning-emoji">📚</span><div><b>{item.name}</b><small>{item.subtitle_summary || item.description || "Learning category"}</small></div></div></td><td><span className="learning-count"><Bookmark /> {itemTopics.length} topics</span></td><td><span className="learning-count"><FileText /> {count} articles</span></td><td className="actions-col" onClick={(event) => event.stopPropagation()}>{menu("category", item.id, item.name)}</td></tr>;
          })}
          {!filteredCategories.length && <tr><td colSpan={4} className="learning-empty">{search ? "No categories match your search." : "No learning categories have been created yet."}</td></tr>}
        </tbody></table></div>
        {pager(filteredCategories.length, "categories", paginated(filteredCategories).pages, paginated(filteredCategories).current)}
      </section>
    </>}

    {screen === "category" && category && <>
      <div className="learning-breadcrumb"><button onClick={() => navigate("categories")}><ArrowLeft /> Back to Categories</button><span>Learning / Categories / <b>{category.name}</b></span></div>
      <div className="learning-page-heading detail"><div><h1>Topic</h1><p>Manage topics within {category.name}.</p></div><button className="learning-primary" onClick={() => setDialog("topic")}><Plus /> Add Topic</button></div>
      <section className="learning-card">
        <div className="learning-topic-card-heading"><h2><BookOpen /> Topics <span>{categoryTopics.length} Active Topics</span></h2><label className="learning-search"><Search /><input placeholder="Search topics..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label></div>
        <div className="learning-table-scroll"><table className="learning-table"><thead><tr><th>Topic</th><th>Articles</th><th className="actions-col">Actions</th></tr></thead><tbody>{paginated(filteredTopics).items.map((item) => <tr key={item.id} className="learning-clickable-row" onClick={() => openEntity("topic", item.id)}><td><div className="learning-record"><span className="learning-emoji"><Folder /></span><div><b>{item.name}</b><small>{item.description || "Learning topic"}</small></div></div></td><td><span className="learning-count"><FileText /> {articles.filter((entry) => entry.topic === item.id).length} articles</span></td><td className="actions-col" onClick={(event) => event.stopPropagation()}>{menu("topic", item.id, item.name)}</td></tr>)}{!filteredTopics.length && <tr><td colSpan={3} className="learning-empty">No topics have been added to this category yet.</td></tr>}</tbody></table></div>
        {pager(filteredTopics.length, "topics", paginated(filteredTopics).pages, paginated(filteredTopics).current)}
      </section>
    </>}

    {screen === "topic" && topic && <>
      <div className="learning-breadcrumb"><button onClick={() => navigate("category")}><ArrowLeft /> Back to Topics</button><span>Learning / Categories / {category?.name} / Topics / <b>{topic.name}</b></span></div>
      <div className="learning-topic-profile"><div className="learning-topic-profile-head"><span><Folder /></span><div><small>Topic information</small><h1>{topic.name}</h1></div><b>{category?.name ?? topic.category_name ?? "Category"}</b></div><p>{topic.description || "No topic description has been added."}</p><footer><span><CheckCircle2 /> Admin managed topic</span><span>ID: {topic.id.slice(0, 8).toUpperCase()}</span></footer><button className="learning-secondary" onClick={() => openEntity("topic", topic.id, true)}><Pencil /> Edit Topic</button></div>
      <section className="learning-card">
        <div className="learning-article-library-heading"><h2>Articles under {topic.name} <span>{topicArticles.length} articles</span></h2><button className="learning-primary" onClick={startCreateArticle}><Plus /> Add Article</button></div>
        <div className="learning-article-filters"><label className="learning-search"><Search /><input placeholder="Search articles..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label><label>Status<select value={articleStatus} onChange={(event) => { setArticleStatus(event.target.value as LearningArticleStatus | "ALL"); setPage(1); }}>{ARTICLE_STATUSES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label>Content type<select value={articleType} onChange={(event) => { setArticleType(event.target.value as LearningArticle["content_type"] | "ALL"); setPage(1); }}><option value="ALL">All types</option><option value="TEXT">Text</option><option value="INFOGRAPHIC">Infographic</option><option value="VIDEO">Video</option><option value="INTERACTIVE">Interactive guide</option></select></label><button className="learning-secondary" aria-label="Refresh articles" onClick={() => setRevision((current) => current + 1)}>↻</button></div>
        <div className="learning-table-scroll"><table className="learning-table"><thead><tr><th>Article</th><th>Type</th><th>Status</th><th>Views</th><th className="actions-col">Actions</th></tr></thead><tbody>{paginated(filteredArticles).items.map((item) => <tr key={item.id} className="learning-clickable-row" onClick={() => openEntity("article", item.id)}><td><div className="learning-record"><span className="learning-emoji"><FileText /></span><div><b>{item.title}</b><small>{dateLabel(item.updated_at)} · {item.author_name || "Learning team"}</small></div></div></td><td><span className="learning-count">{item.content_type}</span></td><td><span className={`learning-status ${item.status.toLowerCase()}`}>{item.status.charAt(0) + item.status.slice(1).toLowerCase()}</span></td><td>{item.views_count ?? 0}</td><td className="actions-col" onClick={(event) => event.stopPropagation()}>{menu("article", item.id, item.title)}</td></tr>)}{!filteredArticles.length && <tr><td colSpan={5} className="learning-empty">No articles match this filter.</td></tr>}</tbody></table></div>
        {pager(filteredArticles.length, "articles", paginated(filteredArticles).pages, paginated(filteredArticles).current)}
      </section>
    </>}

    {screen === "article" && article && <>
      <div className="learning-breadcrumb"><button onClick={() => navigate("topic")}><ArrowLeft /> Back to {topic?.name ?? "Topic"}</button><span>Learning / {category?.name} / {topic?.name} / <b>{article.title}</b></span></div>
      <div className="learning-article-view"><div className="learning-article-title"><span className={`learning-status ${article.status.toLowerCase()}`}>{article.status}</span><h1>{article.title}</h1><p>{article.summary || "No summary has been added."}</p><small>{topic?.name} · {article.reading_time_minutes} min read · {dateLabel(article.updated_at)}</small><button className="learning-primary" onClick={() => openEntity("article", article.id, true)}><Pencil /> Edit Article</button></div><article><div className="learning-article-copy">{article.content.split("\n").filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>{article.key_takeaway_tip && <aside><b>Key takeaway</b><p>{article.key_takeaway_tip}</p></aside>}</article></div>
    </>}

    {(screen === "new-article" || screen === "edit-article") && <ArticleComposer
      mode={screen}
      article={article}
      categoryName={categories.find((item) => item.id === draftCategoryId)?.name ?? category?.name ?? ""}
      topicName={topics.find((item) => item.id === articleDraft.topic)?.name ?? topic?.name ?? ""}
      categories={categories}
      topics={topics}
      categoryId={draftCategoryId}
      draft={articleDraft}
      setCategoryId={setDraftCategoryId}
      setDraft={setArticleDraft}
      onSave={saveArticle}
      onCancel={() => navigate("topic")}
      saving={saving}
      error={error}
    />}

    {screen.startsWith("edit-") && screen !== "edit-article" && currentEntity && <>
      <div className="learning-breadcrumb"><button onClick={() => navigate(screen === "edit-category" ? "category" : screen === "edit-topic" ? "topic" : "article")}><ArrowLeft /> Back</button><span>Learning / Edit {screen.split("-")[1]}</span></div>
      <div className="learning-page-heading detail"><div><h1>Edit {screen.split("-")[1]}</h1><p>Manage learning content and publication information.</p></div></div>
      <form className="learning-edit-card" onSubmit={saveEditedEntity}>
        <header><div><h2>{screen.split("-")[1]} information</h2><p>Update this learning resource.</p></div><span className="learning-pill">Admin managed</span></header>
        {screen === "edit-topic" && <label>Category <select name="category" defaultValue={topic?.category}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small>Determines the topic's placement in the Learning Center.</small></label>}
        <label>{`${screen.split("-")[1]} name`} <sup>*</sup><input required name="name" defaultValue={(currentEntity as LearningCategory | LearningTopic).name} /></label>
        <label>Description<textarea name="description" rows={5} maxLength={500} defaultValue={currentEntity.description} /></label>
        {screen === "edit-topic" && <details className="learning-taxonomy-settings"><summary><Folder /> Additional Clinical Taxonomy Settings</summary><div className="learning-form-row"><label>Icon identifier<input name="icon" defaultValue={topic?.icon ?? "circle-dot"} /></label><label>Display order<input type="number" min="0" name="order" defaultValue={topic?.order ?? 0} /></label></div></details>}
        {error && <p className="learning-inline-error" role="alert">{error}</p>}
        <footer><button type="button" className="learning-secondary" onClick={() => navigate(screen === "edit-category" ? "category" : screen === "edit-topic" ? "topic" : "article")}>Cancel</button><button type="submit" className="learning-primary" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button></footer>
      </form>
    </>}

    {dialog && <div className="learning-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><form className="learning-dialog" onSubmit={submitEntity}>
      <header><div><h2>Add {dialog}</h2><p>{dialog === "category" ? "Create a new learning category." : dialog === "topic" ? `Create a topic in ${category?.name ?? "this category"}.` : `Create an article in ${topic?.name ?? "this topic"}.`}</p></div><button type="button" aria-label="Close dialog" onClick={() => setDialog(null)}><X /></button></header>
      <div className="learning-dialog-body">{dialog === "topic" && <div className="learning-parent-category"><span><Folder /></span><div><small>Add a topic to:</small><b>{category?.name ?? "Selected category"}</b></div><em>Category</em></div>}
        <label>{dialog === "article" ? "Article title" : `${dialog} name`} <sup>*</sup><input autoFocus required name="name" placeholder={`Enter ${dialog} name`} />{dialog === "topic" && <small className="learning-field-help">Clinical name as displayed in patient and clinician portals.</small>}</label>
        {dialog === "article" ? <><label>Summary<textarea name="summary" rows={2} placeholder="Briefly describe this article…" /></label><label>Article content <sup>*</sup><textarea required name="content" rows={6} placeholder="Write the learning material…" /></label><div className="learning-form-row"><label>Publication status<select name="status" defaultValue="DRAFT">{ARTICLE_STATUSES.filter((item) => item.value !== "ALL").map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label>Reading time (minutes)<input type="number" min="1" name="reading_time_minutes" defaultValue="3" /></label></div></> : <label>Description <span>Optional</span><textarea name="description" rows={4} maxLength={500} value={descriptionDraft} onChange={(event) => setDescriptionDraft(event.target.value)} placeholder={`Briefly describe this ${dialog}…`} />{dialog === "topic" && <small className="learning-field-help"><span>Supports standard Markdown formatting</span><span>{descriptionDraft.length} / 500 characters</span></small>}</label>}
        {error && <p className="learning-inline-error" role="alert">{error}</p>}
      </div><footer><button type="button" className="learning-secondary" onClick={() => setDialog(null)}>Cancel</button><button className="learning-primary" disabled={saving}>{saving ? "Saving…" : `Add ${dialog}`}</button></footer>
    </form></div>}

    {deleteTarget && <div className="learning-backdrop"><section className="learning-dialog learning-confirm" role="alertdialog" aria-modal="true" aria-labelledby="learning-delete-title"><header><div><h2 id="learning-delete-title">Delete {deleteTarget.kind}?</h2><p>This will permanently delete “{deleteTarget.name}”.</p></div><button aria-label="Close dialog" onClick={() => setDeleteTarget(null)}><X /></button></header><p className="learning-delete-note">{deleteTarget.kind === "category" ? "Topics and articles in this category will also be deleted." : deleteTarget.kind === "topic" ? "Articles in this topic will also be deleted." : "This article will be removed from the Learning Center."}</p>{error && <p className="learning-inline-error" role="alert">{error}</p>}<footer><button className="learning-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="learning-danger" disabled={saving} onClick={confirmDelete}><Trash2 />{saving ? "Deleting…" : "Delete permanently"}</button></footer></section></div>}
  </div>;
}
