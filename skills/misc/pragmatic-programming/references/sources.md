# Sources and edition scope

This skill is independently authored guidance informed by Andrew Hunt and David Thomas, *The Pragmatic Programmer: From Journeyman to Master*, using the [PDF supplied in the request](https://github.com/iamindian/References_Books/blob/master/The%20Pragmatic%20Programmer.pdf). No book prose, code examples, or PDF is bundled with the skill. The included MIT license covers this repository's authored material, not the source book.

The inspected PDF has 352 pages. Its title page is PDF page 6; page 7 gives ISBN 0-201-61622-X, copyright 2000 Addison Wesley Longman, Inc., and a printing line reading “Printing 25th February 2010.” These identify the original *From Journeyman to Master* material. This skill does not claim coverage of the later 20th Anniversary edition. The title and copyright evidence are preserved here because the supplied copyright page does not explicitly label an edition number.

Page numbers below are one-based PDF pages, followed by printed page numbers. The ranges record material actually inspected for this workflow; they are not a claim to summarize the whole book.

| Inspected chapter and section | PDF pages | Printed pages | Application |
|---|---:|---:|---|
| Chapter 2, §7, The Evils of Duplication | 51–58 | 26–33 | Identify duplicated knowledge, derive multiple representations, and contain cache consistency |
| Chapter 2, §8, Orthogonality | 59–68 | 34–43 | Evaluate independence by functional change and test setup; distinguish it from reducing duplication |
| Chapter 2, §9, Reversibility | 69–72 | 44–47 | Isolate consequential choices and examine their replacement cost |
| Chapter 2, §10, Tracer Bullets | 73–77 | 48–52 | Retain a narrow working integration as the basis for continued development |
| Chapter 2, §11, Prototypes and Post-it Notes, main discussion | 78–81 | 53–56 | Use disposable experiments for focused learning and label their limitations |
| Chapter 6, §33, Refactoring, discussion and first exercises | 209–213 | 184–188 | Separate restructuring from new behavior and use short verified steps |
| Chapter 8, §43, Ruthless Testing, opening through Tightening the Net | 262–271 | 237–246 | Check integration and user needs, test meaningful states, and assess test sensitivity |

The book distinguishes duplicated knowledge from component interdependence and qualifies its one-module ideal: a requirement may change several functions. This skill applies those distinctions to independently owned policies and avoids treating every similar expression as one rule.

The workflow, completion criteria, bounded trigger, and modern examples in the references are an operational synthesis. Persistent-format transitions and explicit evidence limits make reversibility and feedback concrete; they are not presented as a verbatim checklist from the book. Historical product, language, and platform examples are not current recommendations. Verify an actual dependency's contract against its installed version and primary documentation when applying the skill.
