package repository;

import model.Student;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class StudentRepository {
    private final ConcurrentHashMap<Long, Student> students = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(1L);

    public List<Student> findAll() {
        return new ArrayList<>(students.values());
    }

    public Optional<Student> findById(Long id) {
        return Optional.ofNullable(students.get(id));
    }

    public Student save(Student student) {
        if (student.getId() == null) {
            student.setId(sequence.getAndIncrement());
        }
        students.put(student.getId(), student);
        return student;
    }

    public boolean deleteById(Long id) {
        return students.remove(id) != null;
    }
}
