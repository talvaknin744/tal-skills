"""Archive retention and integrity contracts, using local temporary fixtures."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("packager", Path(__file__).resolve().parents[2] / "scripts/research/package-blog-crawl.py")
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)


class Retention(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="tal-skills-archive-test-")
        self.root = Path(self.temp.name).resolve()
        self.source = self.root / "source"
        self.source.mkdir()
        self.output = self.root / "artifacts" / "crawl.tar"

    def tearDown(self):
        self.temp.cleanup()

    def file(self, relative, data):
        path = self.source / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return path

    def package(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return p.package(self.source, self.output, compression="none")

    def test_every_readable_member_is_retained_and_verified(self):
        self.file("recovery-receipt.json", b'{"member_count":60}\n')
        self.file("publishers/site/objects/article/a1/source.bin", b"Original article bytes")
        self.file("reports/first failed attempt.txt", b"Preserved failed run")
        receipt = self.package()
        self.assertEqual(receipt["source_member_count"], 3)
        self.assertEqual(receipt["verified_archive_member_count"], 6)
        self.assertEqual(receipt["structural_and_content_verification"], "passed")
        with tarfile.open(self.output) as archive:
            self.assertEqual(archive.extractfile("reports/first failed attempt.txt").read(), b"Preserved failed run")
            manifest = [json.loads(line) for line in archive.extractfile("archive-evidence/member-manifest.jsonl")]
        self.assertEqual(len(manifest), 3)
        self.assertEqual(p.file_digest(self.output), (receipt["archive_sha256"], receipt["archive_bytes"]))

    def test_unavailable_and_missing_receipt_objects_remain_declared(self):
        blocked = self.file("publishers/site/objects/article/blocked.bin", b"Retained but unavailable")
        missing = "objects/article/missing.bin"
        receipts = [{"receipt": {"object_path": "objects/article/blocked.bin", "sha256": p.sha256(blocked.read_bytes()), "bytes": blocked.stat().st_size}},
                    {"receipt": {"object_path": missing, "sha256": "a" * 64, "bytes": 10}}]
        self.file("publishers/site/body-events.jsonl", p.jsonl_bytes(receipts))
        original = p.open_binary
        def guarded(path):
            if Path(path) == blocked:
                raise PermissionError(1, "Operation not permitted", str(path))
            return original(path)
        with patch.object(p, "open_binary", side_effect=guarded):
            receipt = self.package()
        self.assertEqual(receipt["unavailable_source_entry_count"], 1)
        self.assertEqual(receipt["receipt_object_gap_count"], 2)
        self.assertEqual({row["status"] for row in receipt["receipt_object_gaps"]}, {"missing", "unavailable"})
        with tarfile.open(self.output) as archive:
            self.assertNotIn("publishers/site/objects/article/blocked.bin", archive.getnames())
            self.assertIn("publishers/site/body-events.jsonl", archive.getnames())
            self.assertIn("archive-evidence/receipt-object-gaps.jsonl", archive.getnames())
        self.assertEqual(blocked.read_bytes(), b"Retained but unavailable")

    def test_receipt_hash_mismatch_rejects_pack_and_retains_failure(self):
        self.file("publishers/site/objects/article/post.bin", b"Actual bytes")
        self.file("publishers/site/body-events.jsonl", p.jsonl_bytes([{"receipt": {"object_path": "objects/article/post.bin", "sha256": "0" * 64}}]))
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            self.package()
        self.assertFalse(self.output.exists())
        attempts = self.output.parent / (self.output.name + ".evidence") / "attempts.jsonl"
        self.assertEqual(json.loads(attempts.read_text().splitlines()[-1])["status"], "failed")

    def test_output_inside_source_is_rejected(self):
        self.file("original.txt", b"Keep")
        with self.assertRaisesRegex(ValueError, "outside the input tree"):
            p.package(self.source, self.source / "recursive.tar", compression="none")
        self.assertEqual(list(self.source.iterdir()), [self.source / "original.txt"])

    def test_modified_archive_member_fails_content_verification(self):
        data = b"Original bytes"
        self.file("original.txt", data)
        receipt = self.package()
        expected = [{"path": "original.txt", "bytes": len(data), "sha256": p.sha256(data)}]
        altered = self.root / "modified.tar"
        with tarfile.open(altered, "w") as archive:
            info = tarfile.TarInfo("original.txt")
            info.size = len(data)
            archive.addfile(info, io.BytesIO(b"Tampered bytes"))
        with self.assertRaisesRegex(ValueError, "content mismatch"):
            p.verify_archive(altered, expected, compression="none")
        self.assertEqual(p.file_digest(self.output)[0], receipt["archive_sha256"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
