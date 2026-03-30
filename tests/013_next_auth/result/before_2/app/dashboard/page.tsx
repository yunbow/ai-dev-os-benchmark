export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard (Protected)</h1>
      <p>You are authenticated.</p>
      <form action="/api/auth/logout" method="POST">
        <button type="submit">Logout</button>
      </form>
    </main>
  );
}
