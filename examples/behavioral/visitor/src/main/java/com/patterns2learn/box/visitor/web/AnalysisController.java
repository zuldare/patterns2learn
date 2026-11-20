package com.patterns2learn.box.visitor.web;

import com.patterns2learn.box.visitor.CalorieVisitor;
import com.patterns2learn.box.visitor.EquipmentVisitor;
import com.patterns2learn.box.visitor.Workout;
import com.patterns2learn.box.visitor.WorkoutElement;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AnalysisController {
    public record Analysis(List<String> equipment, int calories) {}

    @PostMapping("/api/wods/analysis")
    public Analysis analyse(@RequestBody List<WorkoutElement> elements) {
        Workout wod = new Workout(elements);
        return new Analysis(wod.visit(new EquipmentVisitor()), wod.visit(new CalorieVisitor()));   // a new visitor per run
    }
}
