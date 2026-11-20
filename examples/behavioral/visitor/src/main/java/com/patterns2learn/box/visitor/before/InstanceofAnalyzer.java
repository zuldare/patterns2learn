package com.patterns2learn.box.visitor.before;

import com.patterns2learn.box.visitor.Cardio;
import com.patterns2learn.box.visitor.Gymnastics;
import com.patterns2learn.box.visitor.Lift;
import com.patterns2learn.box.visitor.WorkoutElement;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** Before: every operation asks each element what it is, in its own chain of instanceof. */
public class InstanceofAnalyzer {
    public List<String> equipment(List<WorkoutElement> elements) {
        Set<String> out = new LinkedHashSet<>();
        for (WorkoutElement e : elements) {
            if (e instanceof Lift) out.add("barbell + plates");
            else if (e instanceof Gymnastics g && g.name().contains("pull-up")) out.add("pull-up bar");
            else if (e instanceof Cardio c && c.machine().equals("row")) out.add("rower");
        }
        return List.copyOf(out);
    }

    // @step:instanceof
    public int calories(List<WorkoutElement> elements) {
        int total = 0;
        for (WorkoutElement e : elements) {
            if (e instanceof Lift l) total += l.reps() * 2;
            else if (e instanceof Gymnastics g) total += g.reps() * 2 / 5;
            // Cardio was added later… and nobody remembered this chain
        }
        return total;
    }
    // @end
}
