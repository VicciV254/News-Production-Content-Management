import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
  ['clean'],
];

export default function RichTextEditor({ value, onChange, readOnly = false }) {
  const modules = useMemo(() => ({
    toolbar: readOnly ? false : TOOLBAR,
  }), [readOnly]);

  return (
    <div className="quill-wrapper">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        readOnly={readOnly}
        placeholder="Write your story here..."
      />
    </div>
  );
}
