

export
class MSet<T> extends Set<T> {
    union(setB: Set<T>|T[]) {
        var union = new MSet(this);
        for (var elem of setB) {
            union.add(elem);
        }
        return union;
    }

    intersection(setB: Set<T>|T[]) {
        var intersection = new MSet<T>();
        for (var elem of setB) {
            if (this.has(elem)) {
                intersection.add(elem);
            }
        }
        return intersection;
    }

    difference(setB: Set<T>|T[]) {
        var difference = new MSet(this);
        for (var elem of setB) {
            difference.delete(elem);
        }
        return difference;
    }
}
