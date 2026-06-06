import Navbar from './Navbar';

export default function Layout({ children, sidebar }) {
  return (
    <>
      <Navbar />
      <main className="app-container fade-in-up">
        {sidebar ? (
          <div className="page-with-sidebar">
            <div>{children}</div>
            <aside>{sidebar}</aside>
          </div>
        ) : (
          children
        )}
      </main>
    </>
  );
}
