package com.patterns2learn.box.prototype.before;

import com.patterns2learn.box.prototype.WeekProgram;
import java.util.ArrayList;

/** Before: the service copies a week by hand, from outside, and only the top level. */
public class ShallowCopyService {
    // @step:shallow
    public WeekProgram duplicate(WeekProgram lastWeek, String newName) {
        return new WeekProgram(newName, new ArrayList<>(lastWeek.days()));   // a new list… of the same days
    }
    // @end
}
