import java.sql.*;
import java.io.*;
import java.util.*;

public class BusProgram {

    static final String DB_URL = "jdbc:mysql://localhost:3306/dbprog";
    static final String DB_USER = "cs5330";
    static final String DB_PASS = "pw5330";

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        System.out.print("Enter csv file name: ");
        String file = in.nextLine();

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS)) {
            BufferedReader br = new BufferedReader(new FileReader(file));
            String line;

            while ((line = br.readLine()) != null) {
                if (line.trim().length() == 0) {
                    continue;
                }

                List<String> row = splitLine(line);
                if (row.size() == 0) {
                    continue;
                }

                String code = row.get(0).trim();

                try {
                    if (code.equals("e")) {
                        makeTables(conn);
                    } else if (code.equals("c")) {
                        clearTables(conn);
                    } else if (code.equals("r")) {
                        doRoute(conn, row, line);
                    } else if (code.equals("t")) {
                        doTime(conn, row, line);
                    } else if (code.equals("R")) {
                        printRoute(conn, row);
                    } else if (code.equals("T")) {
                        printRouteTimes(conn, row);
                    } else if (code.equals("L")) {
                        printLeaving(conn, row);
                    } else if (code.equals("N")) {
                        printCityCounts(conn);
                    } else if (code.equals("C")) {
                        printSameDayTrips(conn, row);
                    } else if (code.equals("S")) {
                        printLongTrips(conn, row);
                    }
                } catch (Exception e) {
                    if (code.equals("r") || code.equals("t")) {
                        System.out.println(line + " Input Invalid");
                    } else {
                        System.out.println("NONE");
                    }
                }
            }

            br.close();
        } catch (Exception e) {
            System.out.println("Could not connect or run program.");
            e.printStackTrace();
        }
    }

    static List<String> splitLine(String line) {
        List<String> list = new ArrayList<>();
        StringBuilder temp = new StringBuilder();
        boolean inQuote = false;

        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                inQuote = !inQuote;
            } else if (ch == ',' && !inQuote) {
                list.add(temp.toString().trim());
                temp.setLength(0);
            } else {
                temp.append(ch);
            }
        }

        list.add(temp.toString().trim());
        return list;
    }

    static void makeTables(Connection conn) throws SQLException {
        Statement stmt = conn.createStatement();

        String routes = "CREATE TABLE IF NOT EXISTS Routes (" +
                "RouteID VARCHAR(100) PRIMARY KEY, " +
                "Departcity VARCHAR(100) NOT NULL, " +
                "Destcity VARCHAR(100) NOT NULL, " +
                "Departstate CHAR(2) NOT NULL, " +
                "Deststate CHAR(2) NOT NULL, " +
                "Traveltime TIME NOT NULL, " +
                "WeekdayOnly BOOLEAN NOT NULL, " +
                "Fare INT NOT NULL, " +
                "CHECK (Fare > 0)" +
                ")";

        String timetable = "CREATE TABLE IF NOT EXISTS TimeTable (" +
                "RouteID VARCHAR(100) NOT NULL, " +
                "Departtime TIME NOT NULL, " +
                "Weekdays BOOLEAN NOT NULL, " +
                "Weekends BOOLEAN NOT NULL, " +
                "PRIMARY KEY (RouteID, Departtime), " +
                "FOREIGN KEY (RouteID) REFERENCES Routes(RouteID) ON DELETE CASCADE, " +
                "CHECK (Weekdays OR Weekends)" +
                ")";

        stmt.executeUpdate(routes);
        stmt.executeUpdate(timetable);
        stmt.close();
    }

    static void clearTables(Connection conn) throws SQLException {
        makeTables(conn);
        Statement stmt = conn.createStatement();
        stmt.executeUpdate("DELETE FROM TimeTable");
        stmt.executeUpdate("DELETE FROM Routes");
        stmt.close();
    }

    static void doRoute(Connection conn, List<String> row, String originalLine) {
        if (row.size() < 9) {
            System.out.println(originalLine + " Input Invalid");
            return;
        }

        try {
            makeTables(conn);

            String routeId = row.get(1);
            String departCity = row.get(2);
            String destCity = row.get(3);
            String departState = row.get(4);
            String destState = row.get(5);
            String travelTime = row.get(6);
            int weekdayOnly = Integer.parseInt(row.get(7));
            int fare = Integer.parseInt(row.get(8));

            if (!checkTime(travelTime, true)) {
                System.out.println(originalLine + " Input Invalid");
                return;
            }
            if (!(weekdayOnly == 0 || weekdayOnly == 1)) {
                System.out.println(originalLine + " Input Invalid");
                return;
            }
            if (fare <= 0) {
                System.out.println(originalLine + " Input Invalid");
                return;
            }

            PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO Routes(RouteID, Departcity, Destcity, Departstate, Deststate, Traveltime, WeekdayOnly, Fare) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            ps.setString(1, routeId);
            ps.setString(2, departCity);
            ps.setString(3, destCity);
            ps.setString(4, departState);
            ps.setString(5, destState);
            ps.setString(6, travelTime + ":00");
            ps.setBoolean(7, weekdayOnly == 1);
            ps.setInt(8, fare);
            ps.executeUpdate();
            ps.close();
        } catch (Exception e) {
            System.out.println(originalLine + " Input Invalid");
        }
    }

    static void doTime(Connection conn, List<String> row, String originalLine) {
        if (row.size() < 5) {
            System.out.println(originalLine + " Input Invalid");
            return;
        }

        try {
            makeTables(conn);

            String routeId = row.get(1);
            String departTime = row.get(2);
            int weekdays = Integer.parseInt(row.get(3));
            int weekends = Integer.parseInt(row.get(4));

            if (!checkTime(departTime, false)) {
                System.out.println(originalLine + " Input Invalid");
                return;
            }
            if (!(weekdays == 0 || weekdays == 1) || !(weekends == 0 || weekends == 1)) {
                System.out.println(originalLine + " Input Invalid");
                return;
            }
            if (weekdays == 0 && weekends == 0) {
                System.out.println(originalLine + " Input Invalid");
                return;
            }

            PreparedStatement checkRoute = conn.prepareStatement(
                    "SELECT RouteID, WeekdayOnly FROM Routes WHERE RouteID = ?"
            );
            checkRoute.setString(1, routeId);
            ResultSet rs = checkRoute.executeQuery();

            if (!rs.next()) {
                rs.close();
                checkRoute.close();
                System.out.println(originalLine + " Input Invalid");
                return;
            }

            boolean routeWeekdayOnly = rs.getBoolean("WeekdayOnly");
            rs.close();
            checkRoute.close();

            if (routeWeekdayOnly && weekends == 1) {
                System.out.println(originalLine + " Input Invalid");
                return;
            }

            PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO TimeTable(RouteID, Departtime, Weekdays, Weekends) VALUES (?, ?, ?, ?)"
            );
            ps.setString(1, routeId);
            ps.setString(2, departTime + ":00");
            ps.setBoolean(3, weekdays == 1);
            ps.setBoolean(4, weekends == 1);
            ps.executeUpdate();
            ps.close();
        } catch (Exception e) {
            System.out.println(originalLine + " Input Invalid");
        }
    }

    static boolean checkTime(String t, boolean allow99Hours) {
        String[] a = t.split(":");
        if (a.length != 2) {
            return false;
        }

        try {
            int hh = Integer.parseInt(a[0]);
            int mm = Integer.parseInt(a[1]);
            if (mm < 0 || mm > 59) {
                return false;
            }
            if (allow99Hours) {
                return hh >= 0 && hh <= 99;
            } else {
                return hh >= 0 && hh <= 23;
            }
        } catch (Exception e) {
            return false;
        }
    }

    static boolean isWeekdayDay(int day) {
        return day >= 1 && day <= 5;
    }

    static boolean isWeekendDay(int day) {
        return day == 0 || day == 6;
    }

    static boolean okForDay(int day, boolean wd, boolean we) {
        if (isWeekdayDay(day) && wd) {
            return true;
        }
        if (isWeekendDay(day) && we) {
            return true;
        }
        return false;
    }

    static void printRoute(Connection conn, List<String> row) throws SQLException {
        if (row.size() < 2) {
            System.out.println("NONE");
            return;
        }

        PreparedStatement ps = conn.prepareStatement(
                "SELECT RouteID, Departcity, Departstate, Destcity, Deststate, TIME_FORMAT(Traveltime, '%H:%i') as TT, Fare, WeekdayOnly " +
                "FROM Routes WHERE RouteID = ?"
        );
        ps.setString(1, row.get(1));
        ResultSet rs = ps.executeQuery();

        if (!rs.next()) {
            System.out.println("NONE");
        } else {
            String out = rs.getString("RouteID") + " , " +
                    rs.getString("Departcity") + " , " +
                    rs.getString("Departstate") + " , " +
                    rs.getString("Destcity") + " , " +
                    rs.getString("Deststate") + " , " +
                    rs.getString("TT") + " , " +
                    rs.getInt("Fare");
            if (rs.getBoolean("WeekdayOnly")) {
                out += " , w";
            }
            System.out.println(out);
        }

        rs.close();
        ps.close();
    }

    static void printRouteTimes(Connection conn, List<String> row) throws SQLException {
        if (row.size() < 3) {
            System.out.println("NONE");
            return;
        }

        String routeId = row.get(1);
        int day = Integer.parseInt(row.get(2));

        PreparedStatement ps = conn.prepareStatement(
                "SELECT TIME_FORMAT(t.Departtime, '%H:%i') as DT, " +
                "TIME_FORMAT(r.Traveltime, '%H:%i') as TT, t.Weekdays, t.Weekends " +
                "FROM Routes r, TimeTable t " +
                "WHERE r.RouteID = t.RouteID AND r.RouteID = ? " +
                "ORDER BY t.Departtime"
        );
        ps.setString(1, routeId);
        ResultSet rs = ps.executeQuery();

        boolean found = false;
        while (rs.next()) {
            boolean wd = rs.getBoolean("Weekdays");
            boolean we = rs.getBoolean("Weekends");
            if (okForDay(day, wd, we)) {
                found = true;
                int dep = timeToMin(rs.getString("DT"));
                int len = timeToMin(rs.getString("TT"));
                int arr = (dep + len) % (24 * 60);
                System.out.println(rs.getString("DT") + " , " + String.format("%02d:%02d", arr / 60, arr % 60));
            }
        }

        if (!found) {
            System.out.println("NONE");
        }

        rs.close();
        ps.close();
    }

    static void printLeaving(Connection conn, List<String> row) throws SQLException {
        if (row.size() < 4) {
            System.out.println("NONE");
            return;
        }

        String city = row.get(1);
        String state = row.get(2);
        int day = Integer.parseInt(row.get(3));

        PreparedStatement ps = conn.prepareStatement(
                "SELECT r.RouteID, TIME_FORMAT(t.Departtime, '%H:%i') as DT, " +
                "TIME_FORMAT(r.Traveltime, '%H:%i') as TT, t.Weekdays, t.Weekends " +
                "FROM Routes r, TimeTable t " +
                "WHERE r.RouteID = t.RouteID AND r.Departcity = ? AND r.Departstate = ? " +
                "ORDER BY t.Departtime, r.RouteID"
        );
        ps.setString(1, city);
        ps.setString(2, state);
        ResultSet rs = ps.executeQuery();

        boolean found = false;
        while (rs.next()) {
            boolean wd = rs.getBoolean("Weekdays");
            boolean we = rs.getBoolean("Weekends");
            if (okForDay(day, wd, we)) {
                found = true;
                int dep = timeToMin(rs.getString("DT"));
                int len = timeToMin(rs.getString("TT"));
                int arr = (dep + len) % (24 * 60);
                System.out.println(rs.getString("RouteID") + " , " + rs.getString("DT") + " , " + String.format("%02d:%02d", arr / 60, arr % 60));
            }
        }

        if (!found) {
            System.out.println("NONE");
        }

        rs.close();
        ps.close();
    }

    static void printCityCounts(Connection conn) throws SQLException {
        String sql =
                "SELECT cityname, statename, COUNT(*) as cnt FROM (" +
                "SELECT Departcity as cityname, Departstate as statename, RouteID FROM Routes " +
                "UNION ALL " +
                "SELECT Destcity as cityname, Deststate as statename, RouteID FROM Routes" +
                ") X " +
                "GROUP BY cityname, statename " +
                "ORDER BY cnt DESC, cityname ASC, statename ASC";

        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(sql);
        boolean found = false;

        while (rs.next()) {
            found = true;
            System.out.println(rs.getString("cityname") + " , " + rs.getString("statename") + " , " + rs.getInt("cnt"));
        }

        if (!found) {
            System.out.println("NONE");
        }

        rs.close();
        stmt.close();
    }

    static class BusEdge {
        String routeId;
        String fromCity;
        String fromState;
        String toCity;
        String toState;
        int leaveMin;
        int arriveMin;
        int timeLen;

        BusEdge(String routeId, String fromCity, String fromState, String toCity, String toState, int leaveMin, int arriveMin, int timeLen) {
            this.routeId = routeId;
            this.fromCity = fromCity;
            this.fromState = fromState;
            this.toCity = toCity;
            this.toState = toState;
            this.leaveMin = leaveMin;
            this.arriveMin = arriveMin;
            this.timeLen = timeLen;
        }
    }

    static class Trip {
        ArrayList<String> routeIds;
        int startMin;
        int endMin;
        int totalMin;

        Trip(ArrayList<String> routeIds, int startMin, int endMin) {
            this.routeIds = new ArrayList<>(routeIds);
            this.startMin = startMin;
            this.endMin = endMin;
            this.totalMin = endMin - startMin;
        }
    }

    static void printSameDayTrips(Connection conn, List<String> row) throws SQLException {
        if (row.size() < 6) {
            System.out.println("NONE");
            return;
        }

        String fromCity = row.get(1);
        String fromState = row.get(2);
        String toCity = row.get(3);
        String toState = row.get(4);
        int day = Integer.parseInt(row.get(5));

        ArrayList<String> out = new ArrayList<>();
        ArrayList<BusEdge> list = new ArrayList<>();

        PreparedStatement ps = conn.prepareStatement(
                "SELECT r.RouteID, r.Departcity, r.Departstate, r.Destcity, r.Deststate, " +
                "TIME_FORMAT(t.Departtime, '%H:%i') as DT, TIME_FORMAT(r.Traveltime, '%H:%i') as TT, " +
                "t.Weekdays, t.Weekends " +
                "FROM Routes r, TimeTable t " +
                "WHERE r.RouteID = t.RouteID " +
                "ORDER BY r.RouteID, t.Departtime"
        );
        ResultSet rs = ps.executeQuery();

        while (rs.next()) {
            boolean wd = rs.getBoolean("Weekdays");
            boolean we = rs.getBoolean("Weekends");
            if (okForDay(day, wd, we)) {
                int dep = timeToMin(rs.getString("DT"));
                int len = timeToMin(rs.getString("TT"));
                int arr = dep + len;
                list.add(new BusEdge(
                        rs.getString("RouteID"),
                        rs.getString("Departcity"),
                        rs.getString("Departstate"),
                        rs.getString("Destcity"),
                        rs.getString("Deststate"),
                        dep,
                        arr,
                        len
                ));
            }
        }

        rs.close();
        ps.close();

        TreeSet<String> direct = new TreeSet<>();
        TreeSet<String> connSet = new TreeSet<>();

        for (int i = 0; i < list.size(); i++) {
            BusEdge a = list.get(i);
            if (a.fromCity.equals(fromCity) && a.fromState.equals(fromState) && a.toCity.equals(toCity) && a.toState.equals(toState) && a.arriveMin < 24 * 60) {
                direct.add(a.routeId);
            }
        }

        for (int i = 0; i < list.size(); i++) {
            BusEdge a = list.get(i);
            if (!(a.fromCity.equals(fromCity) && a.fromState.equals(fromState))) {
                continue;
            }
            for (int j = 0; j < list.size(); j++) {
                BusEdge b = list.get(j);
                if (!(b.toCity.equals(toCity) && b.toState.equals(toState))) {
                    continue;
                }
                if (a.toCity.equals(b.fromCity) && a.toState.equals(b.fromState)) {
                    int wait = b.leaveMin - a.arriveMin;
                    if (wait >= 10 && wait <= 60 && b.arriveMin < 24 * 60) {
                        connSet.add(a.routeId + " , " + b.routeId);
                    }
                }
            }
        }

        for (String s : direct) {
            out.add(s);
        }
        for (String s : connSet) {
            out.add(s);
        }

        if (out.size() == 0) {
            System.out.println("NONE");
        } else {
            for (String s : out) {
                System.out.println(s);
            }
        }
    }

    static void printLongTrips(Connection conn, List<String> row) throws SQLException {
        if (row.size() < 7) {
            System.out.println("NONE");
            return;
        }

        String fromCity = row.get(1);
        String fromState = row.get(2);
        String toCity = row.get(3);
        String toState = row.get(4);
        int maxStops = Integer.parseInt(row.get(5));
        int day = Integer.parseInt(row.get(6));

        ArrayList<BusEdge> edges = getAllEdges(conn, day);
        ArrayList<Trip> ans = new ArrayList<>();
        ArrayList<String> path = new ArrayList<>();

        for (int i = 0; i < edges.size(); i++) {
            BusEdge e = edges.get(i);
            if (e.fromCity.equals(fromCity) && e.fromState.equals(fromState)) {
                path.clear();
                path.add(e.routeId);
                searchTrips(edges, e, toCity, toState, maxStops, path, e.leaveMin, e.arriveMin, ans);
            }
        }

        Collections.sort(ans, new Comparator<Trip>() {
            public int compare(Trip a, Trip b) {
                int ca = a.routeIds.size() - 1;
                int cb = b.routeIds.size() - 1;
                if (ca != cb) {
                    return ca - cb;
                }
                if (a.startMin != b.startMin) {
                    return a.startMin - b.startMin;
                }
                int n = Math.min(a.routeIds.size(), b.routeIds.size());
                for (int i = 0; i < n; i++) {
                    int cmp = a.routeIds.get(i).compareTo(b.routeIds.get(i));
                    if (cmp != 0) {
                        return cmp;
                    }
                }
                return a.routeIds.size() - b.routeIds.size();
            }
        });

        if (ans.size() == 0) {
            System.out.println("NONE");
        } else {
            for (int i = 0; i < ans.size(); i++) {
                Trip t = ans.get(i);
                StringBuilder sb = new StringBuilder();
                for (int j = 0; j < t.routeIds.size(); j++) {
                    if (j > 0) {
                        sb.append(" , ");
                    }
                    sb.append(t.routeIds.get(j));
                }
                sb.append(" , ");
                sb.append(showAbsTime(t.startMin));
                sb.append(" , ");
                sb.append(showTotalTime(t.totalMin));
                System.out.println(sb.toString());
            }
        }
    }

    static void searchTrips(ArrayList<BusEdge> edges, BusEdge cur, String toCity, String toState,
                            int maxStops, ArrayList<String> path, int startMin, int curArrive,
                            ArrayList<Trip> ans) {

        if (cur.toCity.equals(toCity) && cur.toState.equals(toState)) {
            if (curArrive - startMin <= 96 * 60) {
                ans.add(new Trip(path, startMin, curArrive));
            }
        }

        int used = path.size() - 1;
        if (used >= maxStops) {
            return;
        }

        for (int i = 0; i < edges.size(); i++) {
            BusEdge next = edges.get(i);
            if (next.fromCity.equals(cur.toCity) && next.fromState.equals(cur.toState)) {
                int wait = next.leaveMin - cur.arriveMin;
                if (wait >= 10 && wait <= 60) {
                    if (!path.contains(next.routeId)) {
                        int finalArrive = next.arriveMin;
                        if (finalArrive - startMin <= 96 * 60) {
                            path.add(next.routeId);
                            searchTrips(edges, next, toCity, toState, maxStops, path, startMin, finalArrive, ans);
                            path.remove(path.size() - 1);
                        }
                    }
                }
            }
        }
    }

    static ArrayList<BusEdge> getAllEdges(Connection conn, int dayNum) throws SQLException {
        ArrayList<BusEdge> edges = new ArrayList<>();

        String sql = "SELECT r.RouteID, r.Departcity, r.Departstate, r.Destcity, r.Deststate, " +
                "TIME_FORMAT(t.Departtime, '%H:%i') as DT, TIME_FORMAT(r.Traveltime, '%H:%i') as TT, " +
                "t.Weekdays, t.Weekends " +
                "FROM Routes r, TimeTable t WHERE r.RouteID = t.RouteID";

        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(sql);

        while (rs.next()) {
            String routeId = rs.getString("RouteID");
            String fromCity = rs.getString("Departcity");
            String fromState = rs.getString("Departstate");
            String toCity = rs.getString("Destcity");
            String toState = rs.getString("Deststate");
            int dep = timeToMin(rs.getString("DT"));
            int dur = timeToMin(rs.getString("TT"));
            boolean wd = rs.getBoolean("Weekdays");
            boolean we = rs.getBoolean("Weekends");

            for (int addDay = 0; addDay <= 4; addDay++) {
                int actualDay = (dayNum + addDay) % 7;
                if (okForDay(actualDay, wd, we)) {
                    int absDep = addDay * 24 * 60 + dep;
                    int absArr = absDep + dur;
                    edges.add(new BusEdge(routeId, fromCity, fromState, toCity, toState, absDep, absArr, dur));
                }
            }
        }

        rs.close();
        stmt.close();
        return edges;
    }

    static int timeToMin(String s) {
        String[] p = s.split(":");
        int h = Integer.parseInt(p[0]);
        int m = Integer.parseInt(p[1]);
        return h * 60 + m;
    }

    static String showAbsTime(int x) {
        int day = x / (24 * 60);
        int rem = x % (24 * 60);
        int h = rem / 60;
        int m = rem % 60;
        return "D" + day + "-" + String.format("%02d:%02d", h, m);
    }

    static String showTotalTime(int mins) {
        int h = mins / 60;
        int m = mins % 60;
        return String.format("%02d:%02d", h, m);
    }
}