import { useLoaderData, Link, redirect, Form } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { Palette, Color } from "~/../prisma/generated";
import { prisma } from "~/lib/prisma.server";

type PaletteWithColors = Palette & {
  colors: Color[];
  _count: { likes: number };
};

export async function loader(_: LoaderFunctionArgs) {
  const { prisma } = await import("~/lib/prisma.server");

  const palettes: PaletteWithColors[] =
   await prisma.palette.findMany({
    where: { isPublic: true },
    include: {
        colors: true,
        _count: {
        select: { likes: true },
        },
    },
    orderBy: { createdAt: "desc" },
    });

  return { palettes };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("_intent");
  const paletteId =  formData.get("id");
   if (!paletteId) {
    throw new Response("Missing palette id", { status: 400 });
  }

  if (intent === "duplicate") {
    const original = await prisma.palette.findUnique({
      where: { id: paletteId },
      include: { colors: true },
    });

    if (!original) {
      throw new Response("Palette not found", { status: 404 });
    }

    const copy = await prisma.palette.create({
      data: {
        name: `${original.name} (Copy)`,
        isPublic: true,
        colors: {
          create: original.colors.map((c: Color) => ({
             name: c.name,
            hex: c.hex,
          })),
        },
      },
    });

    return redirect(`/palette/${copy.id}`);
  }

    if (intent === "toggle-like") {
    const existing = await prisma.like.findUnique({
        where: { paletteId },
    });

    if (existing) {
        await prisma.like.delete({
        where: { paletteId },
        });
    } else {
        await prisma.like.create({
        data: { paletteId },
        });
    }

    return null;
    }

}

async function shareURL(text: string) {
  await navigator.clipboard.writeText(text);
  alert("Copied URL to clipboard");
}


export default function Explore() {
  const { palettes } = useLoaderData<typeof loader>();

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>Explore Palettes</h1>

      <Link
        to="/"
        style={{
            display: "inline-block",
            marginTop: 24,
            color: "#4f8cff",
            textDecoration: "none",
            
        }}
        >
        ← Back to My Palettes
    </Link>

      {palettes.length === 0 && (
        <p style={{ marginTop: 16, opacity: 0.7 }}>
          No public palettes yet.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
          marginTop: 24,
        }}
      >
        {palettes.map((palette) => (
        <div>
        <div className="palette-card">
          <Link
            key={palette.id}
            to={`/palette/${palette.id}`}
            style={{
              textDecoration: "none",
              color: "inherit",
            //   background: "rgba(255,255,255,0.03)",
              padding: 16,
              borderRadius: 12,
            //   border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              {palette.name}
            </div>

            <div style={{ marginTop: 8, opacity: 0.8, fontSize: 14 }}>
                ❤️ {palette._count.likes}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {palette.colors.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: c.hex,
                    // border: "1px solid rgba(0,0,0,0.2)",
                  }}
                />
              ))}
            </div>
          </Link>
        <section>
            <Form method="post">
                <input type="hidden" name="_intent" value="duplicate" />
                <input type="hidden" name="id" value={palette.id} />

                <button
                type="submit"
                style={{
                    background: "#6366f1",
                    color: "white",
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: "none",
                }}
                >
                Duplicate
                </button>
            </Form>
            <br></br>
            <button
                type="button"
                style={{
                    background: "#10b981",
                    color: "white",
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: "none",
                }}
                onClick={() => shareURL(window.location.origin + `/palette/${palette.id}`)}
                >
                Share
            </button>

           <Form method="post">
                <input type="hidden" name="_intent" value="toggle-like" />
                <input type="hidden" name="id" value={palette.id} />

                <button
                    type="submit"
                    style={{
                    background: palette._count.likes > 0 ? "#555" : "#ef4444",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    }}
                >
                    {palette._count.likes > 0 ? "🤍 Unlike" : "❤️ Like"}
                </button>
            </Form>


        </section>
        </div>
        </div>
        ))}
      </div>
    </main>
  );
}
