Let\'s say you want to buy a house. What\'s the first thing you do? If
you\'re like most of us, you apply for a mortgage. You gather up all
your documents and send them off to a lender. Once you do, that
paperwork will likely be routed through a series of process steps. A
pipeline of sorts: initial intake, credit check, underwriting, document
verification, approval, and so on. That pipeline isn\'t just a
checklist, it\'s what we call a \"process model\". And that\'s just one
of the millions of process models used every day inside of larger
companies. Process models are used in everything from manufacturing, to
insurance, to HR onboarding. Business Process Management (BPM) is the
discipline that builds, maintains, and optimizes these workflows.

At its core, BPM is about formalizing the recurring tasks an
organization performs and turning them into structured models. Models
that define who does what, in what order, using what kind of data. These
models are often drawn up using BPMN diagrams or Petri nets.

BPMN diagrams look like flowcharts. They\'re designed to be intuitive
for business analysts. Petri nets are a more mathematical modeling tool
that represents processes as a network of places, transitions, and
tokens. These are used for more formal analysis.

Both of these are designed to capture three major types of information:
control flow (the sequence of tasks), data flow (what information moves
between steps), and organizational roles. Once formalized in this way,
processes can be simulated, improved, and in many cases automated. The
end goal is to make organizations more efficient, more predictable, and
better able to adapt to change.

But for all their promise, process models are actually surprisingly
fragile. And hard to scale. In theory, you\'d like to apply machine
learning to these models: to compare them, classify them, detect
anomalies, or generate new ones. But that\'s harder than it sounds. Why?
Because data is scarce. Unlike image or text datasets, there\'s no
massive, publicly available corpus of labeled process models. Especially
not with semantic annotations or ground-truth similarity scores. And
even when data exists, it\'s often bespoke. It was built by hand for a
particular company, in a particular domain, with domain-specific
semantics. That\'s what makes this class of problems so tricky. In other
areas of machine learning, you can often sidestep data scarcity with
basic augmentation tricks: rotate an image, swap out a word, inject
noise, and your model gets better. But process models don\'t work like
that. Their structure is tightly coupled to their meaning, and even a
small change (like reordering two steps or modifying a data connection)
can make the process invalid or un-executable in the real world.

So, what can you do? Well, the authors of today\'s paper have a few
ideas.

They built a system for augmenting process models (and training deep
learning systems on those models). First, they created three different
classes of augmentation techniques. Then they applied each technique to
a dataset of process models. This allowed them to generate new workflows
at different levels of fidelity. They then trained a graph neural
network to predict similarity between processes. And finally, they
benchmarked the whole thing. Let\'s dive into each of those main steps
in detail.

As I mentioned, the first thing was defining the three categories of
augmentations. Each one corresponded to a different level of structural
and semantic correctness.

In the first category, they used simple deletion-based methods: dropping
nodes, edges, or semantic annotations at random. These augmentations are
fast and easy to apply but often break the model\'s structure. This
results in syntactically invalid workflows.

In the second category, they focused on replacements: swapping one task
or data node for another while preserving the overall graph structure.
These produce syntactically valid models, but the semantics might not
make sense. Like transporting a part after it\'s already been assembled.

The third category uses AI planning to synthesize new workflows from
scratch or transform existing ones. This is guided by a domain-specific
planning model written in PDDL (a Planning Domain Definition Language
used to formally specify actions, constraints, and goals in automated
planning systems). These augmentations are the most computationally
expensive but yield fully valid, executable processes that respect both
syntax and domain semantics.

Once those categories were defined, the authors applied them to a base
dataset of manufacturing workflows. These workflows were represented as
semantically annotated graphs in a format called NEST, which captures
both the control flow and the data flow of the process. It also holds
metadata like machine capabilities, material states, and resource
constraints. For each workflow, they generated augmented versions using
methods from one or more of the categories above. In some cases, they
swapped steps or altered parameters; in others, they invoked an
automated planner to produce an entirely new sequence of actions that
met the same production goals. By doing this systematically across the
dataset, they built up several new training sets. Each one containing
hundreds of additional workflows at varying levels of fidelity. And by
fidelity we mean how closely the augmented workflows preserve the
structure, logic, and domain validity of real-world processes. In the
end, these sets weren\'t just larger, they were structurally and
semantically diverse in ways that would be hard to achieve manually.

To make use of these workflows, the authors trained a graph neural
network called the Graph Embedding Model (GEM), which takes in a pair of
process models and predicts a similarity score between them.

But why? What\'s the point of computing the similarity score?

Well let\'s say you have a customer service workflow. It handles
incoming support tickets, routes them by topic, escalates urgent issues,
and assigns agents to follow up. But then a flu outbreak hits your team.
Suddenly all of your agents are out sick. The customer service system
has broken down. Calls are coming in, but no one\'s there to answer.
Well, what if there was a similar process? Maybe one that reroutes calls
to a vetted third-party call center, or temporarily defers low-priority
issues with automated responses? If your system can detect that
alternative process as being functionally similar, you can pivot to it
quickly and keep service interruptions to a minimum.

That would be great right? Well, finding such a process might be
difficult. And that\'s what similarity-scoring is about. If processes
are marked by similarity, then you can retrieve or compare processes
based on their behavior, structure, and intent, not just their labels.
If two processes are similar, then one can potentially substitute for
the other when things go wrong, or be reused in a new context. But if
they\'re dissimilar, then blindly reusing them could lead to execution
errors or violations of business rules. So by computing similarity, you
are actually enabling retrieval and adaptation later on.

And that\'s why the GEM architecture is important. It starts by
embedding the semantic and structural features of each graph (types,
annotations, and connections) into dense vector representations. It then
uses message passing to propagate information across the graph,
aggregates the result into a single embedding for each process, and
computes their similarity via cosine distance. Training the GEM required
both labeled and unlabeled data, so they used a two-phase approach:
first, they pre-trained the network using a triplet loss on the
augmented data alone. This treated each augmented process as a
near-duplicate of its original. Then they fine-tuned the network on a
smaller set of ground-truth similarity scores using supervised
regression. This allowed them to leverage the unlabeled, augmented data
to improve generalization without the need for costly new annotations.

And finally, it was time to test it out. They benchmarked the model
against a traditional graph-matching approach that computes process
similarity using an A\* search over node and edge mappings. While the
A\* method can (in some cases) be highly accurate, it\'s also slow and
computationally expensive. Especially for large graphs or large
repositories. The GEM, by contrast, showed consistent inference times,
and could be accelerated on GPUs. In head-to-head comparisons, they
found that GEM trained on augmented data consistently outperformed the
baseline in both accuracy and runtime. Augmentations from the third
category (those generated via AI planning) yielded the best results, but
even the simplest deletion-based augmentations provided measurable
improvements. When combining methods from all three categories, the
model achieved its lowest error rates overall.

The key takeaway here is that augmenting process models isn\'t just
possible, it\'s effective---provided that you do it thoughtfully. By
categorizing augmentation methods based on the level of correctness they
preserve, the authors show that you don\'t have to choose between scale
and structure. Even noisy, low-fidelity augmentations help. But
semantically valid, planner-generated workflows provide the biggest
boost. And when combined with a semi-supervised training pipeline, these
augmentations can dramatically improve model performance, even when
labeled data is scarce. This isn\'t just a strategy for one niche
domain, it\'s a general recipe for building better graph-based models
when the data is limited, complex, and expensive to annotate.

If you want to dig deeper into how this all works, the full PDF walks
through each augmentation method, the use of PDDL, the triplet-based
training process, and the design of their pipeline. Whether you\'re
working on process mining, graph learning, or just looking for new ways
to scale machine learning under data constraints, then I\'d highly
recommend that you download the paper.
