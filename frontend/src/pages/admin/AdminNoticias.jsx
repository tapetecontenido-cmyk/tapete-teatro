// src/pages/admin/AdminNoticias.jsx
// Gestión de noticias con editor rich text TipTap
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Plus, Edit2, X, Bold, Italic, List, Heading2, Upload, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

const CATEGORIAS = ['Anuncios', 'Premios', 'Artículos', 'Estrenos', 'Talleres', 'Comunidad'];

function EditorToolbar({ editor }) {
  if (!editor) return null;
  return (
    <div className="flex gap-1 p-2 border-b border-gray-200 flex-wrap">
      {[
        [() => editor.chain().focus().toggleBold().run(), <Bold size={14} />, 'bold', 'Negrita'],
        [() => editor.chain().focus().toggleItalic().run(), <Italic size={14} />, 'italic', 'Cursiva'],
        [() => editor.chain().focus().toggleBulletList().run(), <List size={14} />, 'bulletList', 'Lista'],
        [() => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={14} />, 'heading', 'Subtítulo'],
      ].map(([onClick, icon, type, title], i) => (
        <button key={i} type="button" title={title} onClick={onClick}
          className={`p-2 rounded-lg text-sm transition-colors ${editor.isActive(type) ? 'bg-azul text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          {icon}
        </button>
      ))}
    </div>
  );
}

export default function AdminNoticias() {
  const [noticias,  setNoticias]  = useState([]);
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [form,      setForm]      = useState({ titulo: '', resumen: '', categoria: '', autor: '', publicado: false });
  const [imagen,    setImagen]    = useState(null);
  const [guardando, setGuardando] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: { attributes: { class: 'prose max-w-none p-4 min-h-40 outline-none text-gray-800 text-sm' } }
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'noticias'), orderBy('fecha', 'desc')), snap => {
      setNoticias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ titulo: '', resumen: '', categoria: '', autor: '', publicado: false });
    editor?.commands.setContent('');
    setImagen(null);
    setModal(true);
  };

  const abrirEditar = (n) => {
    setEditando(n);
    setForm({ titulo: n.titulo, resumen: n.resumen || '', categoria: n.categoria || '', autor: n.autor || '', publicado: n.publicado });
    editor?.commands.setContent(n.contenidoHtml || '');
    setImagen(null);
    setModal(true);
  };

  const handleGuardar = async () => {
    if (!form.titulo) { toast.error('El título es requerido'); return; }
    setGuardando(true);
    try {
      let imagenUrl = editando?.imagenUrl || '';
      if (imagen) {
        const ref = sRef(storage, `noticias/${Date.now()}_${imagen.name}`);
        await uploadBytes(ref, imagen);
        imagenUrl = await getDownloadURL(ref);
      }
      const data = {
        titulo:        DOMPurify.sanitize(form.titulo.trim()),
        resumen:       DOMPurify.sanitize(form.resumen.trim()),
        categoria:     form.categoria,
        autor:         DOMPurify.sanitize(form.autor.trim()),
        publicado:     form.publicado,
        contenidoHtml: editor?.getHTML() || '',
        imagenUrl,
        fecha:         serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      };
      if (editando) {
        await updateDoc(doc(db, 'noticias', editando.id), data);
        toast.success('Noticia actualizada');
      } else {
        await addDoc(collection(db, 'noticias'), data);
        toast.success('Noticia creada');
      }
      setModal(false);
    } catch { toast.error('Error al guardar'); }
    finally { setGuardando(false); }
  };

  const togglePublicado = async (id, publicado) => {
    await updateDoc(doc(db, 'noticias', id), { publicado: !publicado });
    toast.success(publicado ? 'Artículo despublicado' : 'Artículo publicado');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-display-sm text-gray-900">Noticias</h1>
        <button onClick={abrirNuevo} className="btn-primary gap-2"><Plus size={18} /> Nueva noticia</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-gray-50 text-xs font-heading font-bold text-gray-500 uppercase tracking-wide"><th className="px-5 py-3 text-left">Título</th><th className="px-5 py-3 text-left hidden md:table-cell">Categoría</th><th className="px-5 py-3 text-left hidden lg:table-cell">Fecha</th><th className="px-5 py-3 text-center">Estado</th><th className="px-5 py-3 text-center">Acciones</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {noticias.map(n => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td className="px-5 py-3"><p className="font-heading font-bold text-gray-900 text-sm">{n.titulo}</p><p className="text-xs text-gray-400">{n.autor}</p></td>
                <td className="px-5 py-3 hidden md:table-cell"><span className="badge bg-cyan/10 text-cyan">{n.categoria}</span></td>
                <td className="px-5 py-3 hidden lg:table-cell text-xs text-gray-400">{n.fecha && format(n.fecha.toDate?.() || new Date(), 'd MMM yyyy', { locale: es })}</td>
                <td className="px-5 py-3 text-center">
                  <button onClick={() => togglePublicado(n.id, n.publicado)} className={`badge ${n.publicado ? 'badge-confirmed cursor-pointer' : 'badge-pending cursor-pointer'}`}>
                    {n.publicado ? 'Publicado' : 'Borrador'}
                  </button>
                </td>
                <td className="px-5 py-3 text-center">
                  <button onClick={() => abrirEditar(n)} className="p-2 hover:bg-azul/10 hover:text-azul rounded-lg transition-colors text-gray-400"><Edit2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {noticias.length === 0 && <div className="p-10 text-center text-gray-400 font-heading">Sin noticias aún</div>}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="font-heading font-bold text-xl">{editando ? 'Editar noticia' : 'Nueva noticia'}</h2>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="label-field">Título</label><input value={form.titulo} onChange={e => setForm(p => ({...p, titulo: e.target.value}))} className="input-field" /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label-field">Categoría</label>
                  <select value={form.categoria} onChange={e => setForm(p => ({...p, categoria: e.target.value}))} className="input-field">
                    <option value="">Seleccionar</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label-field">Autor</label><input value={form.autor} onChange={e => setForm(p => ({...p, autor: e.target.value}))} className="input-field" /></div>
              </div>
              <div><label className="label-field">Resumen</label><textarea value={form.resumen} onChange={e => setForm(p => ({...p, resumen: e.target.value}))} className="input-field resize-none" rows={2} /></div>
              <div>
                <label className="label-field">Contenido</label>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-azul transition-colors">
                  <EditorToolbar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              </div>
              <div>
                <label className="label-field">Imagen destacada</label>
                <label className="flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer hover:border-azul transition-colors">
                  <input type="file" className="hidden" accept="image/*" onChange={e => setImagen(e.target.files?.[0] || null)} />
                  {imagen ? <><CheckCircle size={18} className="text-green-500" /><span className="text-sm text-green-600">{imagen.name}</span></> : <><Upload size={18} className="text-gray-400" /><span className="text-sm text-gray-400">Subir imagen</span></>}
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="publicado" checked={form.publicado} onChange={e => setForm(p => ({...p, publicado: e.target.checked}))} className="w-4 h-4 accent-azul" />
                <label htmlFor="publicado" className="text-sm font-heading font-bold text-gray-700 cursor-pointer">Publicar inmediatamente</label>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setModal(false)} className="btn-outline flex-1 py-3">Cancelar</button>
              <button onClick={handleGuardar} disabled={guardando} className="btn-primary flex-1 py-3">
                {guardando ? <span className="spinner w-5 h-5" /> : editando ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
