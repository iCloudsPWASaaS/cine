import { FolderOpen, Plus, Trash2 } from "lucide-react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/admin/actions/taxonomy";
import { Flash } from "@/components/admin/flash";
import { SubmitButton } from "@/components/admin/submit-button";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const categories = await getCategories(false);

  return (
    <div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          Taxonomy
        </p>
        <h1 className="display mt-1 text-4xl tracking-[0.03em] sm:text-5xl">
          Categories
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/40">
          Categories power the homepage rows and the catalogue filters. Use a
          clear name and a stable slug.
        </p>
      </div>

      <div className="mt-6">
        <Flash searchParams={params} />
      </div>

      <section className="admin-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <Plus size={16} className="text-gold" /> Add category
        </h2>
        <form
          action={createCategoryAction}
          className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5"
        >
          <div>
            <label className="label" htmlFor="new-category-name">
              Name *
            </label>
            <input
              id="new-category-name"
              name="name"
              required
              placeholder="Latest Movies"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="new-category-slug">
              Slug
            </label>
            <input
              id="new-category-slug"
              name="slug"
              placeholder="auto"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="new-category-sort">
              Sort order
            </label>
            <input
              id="new-category-sort"
              name="sort_order"
              type="number"
              defaultValue={100}
              className="input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="new-category-description">
              Description
            </label>
            <input
              id="new-category-description"
              name="description"
              className="input"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked
              className="h-4 w-4 accent-[#f2c86b]"
            />
            Active
          </label>
          <div className="flex items-end md:col-span-1">
            <SubmitButton className="btn-gold w-full" pendingText="Creating…">
              <Plus size={15} /> Create
            </SubmitButton>
          </div>
        </form>
      </section>

      <div className="mt-6 space-y-3">
        {categories.length === 0 ? (
          <p className="admin-card px-5 py-10 text-center text-sm text-white/35">
            No categories yet.
          </p>
        ) : null}

        {categories.map((category) => (
          <div key={category.id} className="admin-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
              <form
                action={updateCategoryAction}
                className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
              >
                <input type="hidden" name="id" value={category.id} />
                <div>
                  <label
                    className="label"
                    htmlFor={`category-name-${category.id}`}
                  >
                    Name
                  </label>
                  <input
                    id={`category-name-${category.id}`}
                    name="name"
                    defaultValue={category.name}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label
                    className="label"
                    htmlFor={`category-slug-${category.id}`}
                  >
                    Slug
                  </label>
                  <input
                    id={`category-slug-${category.id}`}
                    name="slug"
                    defaultValue={category.slug}
                    className="input"
                  />
                </div>
                <div>
                  <label
                    className="label"
                    htmlFor={`category-sort-${category.id}`}
                  >
                    Sort
                  </label>
                  <input
                    id={`category-sort-${category.id}`}
                    name="sort_order"
                    type="number"
                    defaultValue={category.sort_order}
                    className="input"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex h-[42px] items-center gap-2 text-sm text-white/60">
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked={category.is_active}
                      className="h-4 w-4 accent-[#f2c86b]"
                    />
                    Active
                  </label>
                </div>
                <div className="md:col-span-2 xl:col-span-3">
                  <label
                    className="label"
                    htmlFor={`category-description-${category.id}`}
                  >
                    Description
                  </label>
                  <input
                    id={`category-description-${category.id}`}
                    name="description"
                    defaultValue={category.description || ""}
                    className="input"
                  />
                </div>
                <div className="flex items-end">
                  <SubmitButton
                    className="btn-gold w-full !py-2.5 text-xs"
                    pendingText="Saving…"
                  >
                    <FolderOpen size={14} /> Save
                  </SubmitButton>
                </div>
              </form>

              <form action={deleteCategoryAction} className="flex items-end">
                <input type="hidden" name="id" value={category.id} />
                <SubmitButton
                  className="btn-danger !py-2.5 text-xs"
                  pendingText="…"
                  confirm={`Delete category "${category.name}"? Movies will become uncategorised.`}
                >
                  <Trash2 size={13} /> Delete
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
