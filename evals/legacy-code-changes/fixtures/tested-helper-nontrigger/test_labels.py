import unittest
from labels import display_label


class LabelTests(unittest.TestCase):
    def test_surrounding_whitespace(self):
        self.assertEqual(display_label("  rachel stone  "), "Rachel Stone")

    def test_empty_name(self):
        self.assertEqual(display_label("  "), "")

    def test_existing_capitalization(self):
        self.assertEqual(display_label("RACHEL stone"), "Rachel Stone")


if __name__ == "__main__":
    unittest.main()
