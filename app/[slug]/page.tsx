import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import pokemonData from "../data/pokemon.json";
import { STAT_COLORS, TYPE_STYLE } from "../labels";
import { DriftingBackground } from "../drifting-background";
import { FavoriteButton } from "./favorite-button";
import { SiteFooter } from "../site-footer";
import {
  type EvoNode,
  describeConditions,
  describeDrop,
  describeLocations,
  describeSeasons,
  faqFor,
  formatWeight,
  labels,
  loadSpecies,
} from "../species-lib";
import styles from "../species.module.css";

type PageProps = { params: Promise<{ slug: string }> };

const MAX_STAT = 255;
const STAT_LABELS = ["Vida", "Ataque", "Defesa", "Ataque especial", "Defesa especial", "Velocidade"];

const pokemon = pokemonData.pokemon;
const groupLabels = Object.fromEntries(pokemonData.groups.map((g) => [g.id, g.label.pt]));

export function generateStaticParams() {
  return pokemon.map((p) => ({ slug: p.key }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const species = await loadSpecies(slug);
  if (!species) return { robots: { index: false, follow: false } };
  const nome = species.namePt ?? species.name;
  const title = `${nome} (#${String(species.dex).padStart(3, "0")}) | Pelipper Town Stats`;
  const description = `${nome} no mod Pelipper Town para Stardew Valley: tipo, golpes por nível, evolução, drops, onde encontrar e tarefas.`;
  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: { title, description, url: `/${slug}` },
    twitter: { title, description },
  };
}

type MegaForm = { key: string; name: string; sprite: string | undefined };

// Formas Mega agrupadas pela espécie base (ex.: "charizard" -> Mega Charizard X/Y).
async function megaFormsByBase(): Promise<Record<string, MegaForm[]>> {
  const megas = await Promise.all(
    pokemon
      .filter((p) => p.derived && p.key.startsWith("mega-"))
      .map(async (p) => {
        const sp = await loadSpecies(p.key);
        return { base: sp?.derivedFrom ?? null, key: p.key, name: sp?.namePt ?? p.name, sprite: p.sprite };
      }),
  );
  const byBase: Record<string, MegaForm[]> = {};
  for (const m of megas) {
    if (m.base) (byBase[m.base] ??= []).push({ key: m.key, name: m.name, sprite: m.sprite });
  }
  return byBase;
}

function EvoBranch({ node }: { node: EvoNode }) {
  const current = pokemon.find((p) => p.key === node.key);
  return (
    <div className={styles.evoNode}>
      <Link href={`/${node.key}`} className={styles.evoCard} aria-label={node.namePt ?? node.name}>
        {current?.sprite && (
          <Image src={current.sprite} alt="" width={64} height={64} unoptimized />
        )}
        <span>{node.namePt ?? node.name}</span>
      </Link>
      {node.to.length > 0 && (
        <div className={styles.evoBranches}>
          {node.to.map((edge) => (
            <div key={edge.node.key} className={styles.evoEdge}>
              <span className={styles.evoCondition}>{describeConditions(edge.conditions)}</span>
              <EvoBranch node={edge.node} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Mega de toda a família da árvore, mostradas centralizadas abaixo dela.
function collectMegas(node: EvoNode, megas: Record<string, MegaForm[]>): MegaForm[] {
  return [...(megas[node.key] ?? []), ...node.to.flatMap((e) => collectMegas(e.node, megas))];
}

async function SpeciesContent({ params }: PageProps) {
  const { slug } = await params;
  const species = await loadSpecies(slug);
  if (!species) notFound();

  const base = pokemon.find((p) => p.key === slug);
  const megas = await megaFormsByBase();
  const megaForms = megas[species.key] ?? [];
  const familyMegas = collectMegas(species.evolutions.tree, megas);
  const faq = faqFor(species, megaForms);
  const enc = species.encounter;
  const number = `#${String(species.dex).padStart(3, "0")}`;

  return (
    <main className={styles.page}>
      <DriftingBackground src={`/backgrounds/${species.types[0] ?? "Normal"}.webp`} />
      <div className={styles.container}>
        <Link href="/" className={styles.back}>
          ‹ Todos os Pokémon
        </Link>

        <header className={styles.hero}>
          <div className={styles.spriteCol}>
            {base?.sprite && (
              <Image
                className={styles.sprite}
                src={base.sprite}
                alt={species.namePt ?? species.name}
                width={160}
                height={160}
                unoptimized
              />
            )}
            <FavoriteButton pokemonKey={species.key} />
          </div>
          <div className={styles.heroText}>
            <p className={styles.number}>{number}</p>
            <h1 className={styles.title}>{species.namePt ?? species.name}</h1>
            <div className={styles.types}>
              {species.types.map((t) => (
                <span key={t} className={styles.type} style={{ background: TYPE_STYLE[t]?.color }}>
                  {labels.type(t)}
                </span>
              ))}
            </div>
            {(species.descriptionPt ?? species.description) && (
              <p className={styles.description}>{species.descriptionPt ?? species.description}</p>
            )}
          </div>
        </header>

        <section className={styles.card} aria-labelledby="info">
          <h2 id="info">Informações</h2>
          <dl className={styles.facts}>
            <dt>Nº Pokédex</dt>
            <dd>{number}</dd>
            <dt>Tipo</dt>
            <dd className={styles.types}>
              {species.types.map((t) => (
                <span key={t} className={styles.type} style={{ background: TYPE_STYLE[t]?.color }}>
                  {labels.type(t)}
                </span>
              ))}
            </dd>
            <dt>Peso</dt>
            <dd>{formatWeight(species.weightKg)}</dd>
            <dt>Geração</dt>
            <dd>{species.generation ?? "—"}</dd>
            <dt>Grupo no site</dt>
            <dd>{groupLabels[species.group] ?? species.group}</dd>
            <dt>Reprodução</dt>
            <dd>
              {species.breeding?.canBreed
                ? `Sim, o ovo eclode em ${species.breeding.eggSteps ?? "—"} passos`
                : "Não"}
            </dd>
          </dl>
        </section>

        {base && (
          <section className={styles.card} aria-labelledby="stats">
            <h2 id="stats">Stats base</h2>
            <ul className={styles.stats}>
              {base.stats.map((value, i) => (
                <li key={STAT_LABELS[i]} className={styles.statRow}>
                  <span className={styles.statName}>{STAT_LABELS[i]}</span>
                  <span className={styles.statValue}>{value}</span>
                  <span className={styles.statTrack}>
                    <span
                      className={styles.statFill}
                      style={{
                        width: `${Math.min(100, (value / MAX_STAT) * 100)}%`,
                        background: STAT_COLORS[i],
                      }}
                    />
                  </span>
                </li>
              ))}
              <li className={styles.statTotal}>
                <span>Total</span>
                <span className={styles.statValue}>{base.stats.reduce((a, b) => a + b, 0)}</span>
              </li>
            </ul>
          </section>
        )}

        <section className={styles.card} aria-labelledby="evo">
          <h2 id="evo">Evoluções</h2>
          {species.evolutions.tree.to.length || species.evolutions.from.length || familyMegas.length ? (
            <div className={styles.evoRoot}>
              <div className={styles.evoCenter}>
                <EvoBranch node={species.evolutions.tree} />
                {familyMegas.length > 0 && (
                  <div className={styles.evoMega}>
                    {familyMegas.map((m) => (
                      <Link key={m.key} href={`/${m.key}`} className={styles.megaCard} aria-label={m.name}>
                        <span className={styles.megaLabel}>Mega evolução</span>
                        {m.sprite && <Image src={m.sprite} alt="" width={64} height={64} unoptimized />}
                        <span>{m.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className={styles.muted}>Este Pokémon não evolui.</p>
          )}
        </section>

        {species.key.startsWith("mega-") && (
          <section className={styles.card} aria-labelledby="mega-req">
            <h2 id="mega-req">Como fazer a Mega evolução</h2>
            <ul className={styles.list}>
              <li>Ter um Pokémon no nível 50: o prefeito Lewis envia a receita da Mega Band.</li>
              <li>Receita: 1 Barra de Irídio e 1 Fragmento Prismático.</li>
              <li>Ter a Mega Band e colocar o Pokémon compatível como parceiro ativo.</li>
              <li>Segurar a Mega Band e apertar Ação.</li>
              <li>Uma Mega evolução por fazendeiro por dia, até a hora de dormir ou até o Pokémon desmaiar.</li>
              <li>Só um parceiro pode estar em Mega ao mesmo tempo.</li>
              <li>Efeitos: +25% de vida e status máximos, +15% de velocidade no campo e passiva com força 1,5x.</li>
            </ul>
            <p className={styles.muted}>Regras do guia do jogador do mod. Os nomes dos itens em português são traduções próprias, a confirmar.</p>
          </section>
        )}

        <section className={styles.card} aria-labelledby="moves">
          <h2 id="moves">Golpes aprendidos por nível</h2>
          {species.moves.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nível</th>
                    <th>Golpe</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Poder</th>
                  </tr>
                </thead>
                <tbody>
                  {species.moves.map((m, i) => (
                    <tr key={`${m.id}-${m.level}-${i}`}>
                      <td>{m.level}</td>
                      <td>{m.namePt ?? m.name}</td>
                      <td>
                        {m.type && (
                          <span className={styles.typeSmall} style={{ background: TYPE_STYLE[m.type]?.color }}>
                            {labels.type(m.type)}
                          </span>
                        )}
                      </td>
                      <td>{labels.category(m.category)}</td>
                      <td>{m.power ? m.power : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.muted}>Não há golpes por nível cadastrados.</p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="abilities">
          <h2 id="abilities">Habilidades</h2>
          {species.abilities.length ? (
            <ul className={styles.list}>
              {species.abilities.map((a) => (
                <li key={a.id}>
                  <strong>{a.namePt ?? a.name}</strong>
                  {(a.descriptionPt ?? a.description) && (
                    <span className={styles.muted}> — {a.descriptionPt ?? a.description}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>Nenhuma habilidade cadastrada.</p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="jobs">
          <h2 id="jobs">Tarefas no jogo</h2>
          {species.jobs.length ? (
            <ul className={styles.jobs}>
              {species.jobs.map((j) => (
                <li key={j.id} className={styles.job}>
                  <Image src={`/jobs/${j.id.toLowerCase()}.png`} alt="" width={32} height={32} unoptimized />
                  <span>{labels.job(j.id)}</span>
                  {j.maxTier !== null && <span className={styles.muted}>nível máx. {j.maxTier}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>Não faz tarefas.</p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="where">
          <h2 id="where">Onde aparece</h2>
          {enc?.enabled ? (
            <>
              <dl className={styles.facts}>
                <dt>Locais</dt>
                <dd>{describeLocations(enc.locations)}</dd>
                <dt>Estações</dt>
                <dd>{describeSeasons(enc.seasons)}</dd>
                <dt>Horário</dt>
                <dd>{enc.timesOfDay.length ? enc.timesOfDay.map(labels.time).join(", ") : "Qualquer horário"}</dd>
                <dt>Níveis selvagens</dt>
                <dd>
                  {enc.minLevel} a {enc.maxLevel}
                </dd>
                <dt>Taxa de captura</dt>
                <dd>{enc.catchRate !== null ? `${Math.round(enc.catchRate * 100)}%` : "—"}</dd>
                <dt>Raridade</dt>
                <dd>{labels.rarity(enc.rarityTier)}</dd>
                <dt>Ameaça</dt>
                <dd>{labels.threat(enc.threatTier)}</dd>
              </dl>

              {enc.profiles.length > 0 && (
                <>
                  <h3 className={styles.subtitle}>Raridade por ambiente</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Ambiente</th>
                          <th>Locais</th>
                          <th>Raridade</th>
                          <th>Ameaça</th>
                          <th>Níveis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enc.profiles.map((p, i) => (
                          <tr key={`${p.context}-${i}`}>
                            <td>
                              {labels.context(p.context)}
                              {p.seasons.length > 0 && <span className={styles.muted}> ({describeSeasons(p.seasons)})</span>}
                            </td>
                            <td>{p.locations.length ? describeLocations(p.locations) : "—"}</td>
                            <td>{labels.rarity(p.rarityTier)}</td>
                            <td>{labels.threat(p.threatTier)}</td>
                            <td>
                              {p.minLevel ?? "—"} a {p.maxLevel ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <h3 className={styles.subtitle}>Itens ao ser derrotado</h3>
              {enc.drops.length ? (
                <ul className={styles.dropList}>
                  {enc.drops.map((d) => (
                    <li key={d.itemId} className={styles.dropItem}>
                      <Image src={`/items/${d.itemId.match(/(\d+)$/)?.[1]}.png`} alt="" width={32} height={32} unoptimized />
                      {describeDrop(d)}
                      <span className={styles.muted}>
                        {" "}
                        — {Math.round(d.chance * 100)}%, quantidade{" "}
                        {d.minStack === d.maxStack ? d.minStack : `${d.minStack} a ${d.maxStack}`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>Não deixa itens ao ser derrotado.</p>
              )}
            </>
          ) : (
            <p className={styles.muted}>
              {species.derivedFrom
                ? `Esta é uma forma de ${species.derivedFrom} e não aparece no mundo selvagem.`
                : "Este Pokémon não aparece no mundo selvagem."}
            </p>
          )}
        </section>

        {species.behavior && (
          <section className={styles.card} aria-labelledby="behavior">
            <h2 id="behavior">Preferências</h2>
            <dl className={styles.facts}>
              <dt>Clima preferido</dt>
              <dd>
                {species.behavior.preferredWeather.length
                  ? species.behavior.preferredWeather.map(labels.weather).join(", ")
                  : "Nenhum"}
              </dd>
              <dt>Locais preferidos</dt>
              <dd>{describeLocations(species.behavior.preferredLocations)}</dd>
            </dl>
          </section>
        )}

        <section className={styles.card} aria-labelledby="faq">
          <h2 id="faq">Dúvidas comuns</h2>
          <div className={styles.faq}>
            {faq.map((item) => (
              <details key={item.question} className={styles.faqItem}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
          <p className={styles.muted}>
            Raridade indica com que frequência o Pokémon aparece. Ameaça indica o quão perigoso ele é em combate.
          </p>
        </section>

        <SiteFooter lang="pt" copyright="Chat 🤖" portfolio="Portfólio" />
      </div>
    </main>
  );
}

export default function SpeciesPage(props: PageProps) {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <SpeciesContent {...props} />
    </Suspense>
  );
}
